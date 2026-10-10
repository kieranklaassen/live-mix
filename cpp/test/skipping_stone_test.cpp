// Native harness for Skipping Stone (cpp/devices/skipping-stone). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest asserts what makes it a stone
// skipping over water: when the landings come, how loud, how dull, how low
// and where, when the throw ends, and what Ripple and Again do to it.

#include <limits>

#include "../devices/skipping-stone/skipping_stone.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::SkippingStone;
namespace p = livemix::skipping_stone;

static SkippingStone device;

static const float kRate = 48000.0f;
// A click small enough to pass the ring's limiter untouched (linear below 0.5).
static const float kClick = 0.25f;
// A centred landing is on both sides at this gain (equal power).
static const double kCentre = 0.70710678;

// Every landing a plain tap in the middle, as loud as the first: the throw alone.
static void bare(SkippingStone& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kLoss, 0.0f);
  d.set_param(p::kSink, 0.0f);
  d.set_param(p::kDrop, 0.0f);
  d.set_param(p::kThrow, 0.0f);
  d.set_param(p::kRipple, 0.0f);
  d.set_param(p::kAgain, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// The sample a landing falls on, as the device rounds it.
static size_t sample_of(float seconds, float rate = kRate) {
  return static_cast<size_t>(std::min(seconds, SkippingStone::kMaxThrowSeconds) * rate + 0.5f);
}

// The gain of two one-poles with pole `a` at `hz`.
static double two_poles(double a, double hz, double rate) {
  const double w = 2.0 * kPi * hz / rate;
  return (1.0 - a) * (1.0 - a) / (1.0 - 2.0 * a * std::cos(w) + a * a);
}

// The pole Sink gives the landing after `skipped` skips (skipping_stone.h, retarget).
static double sink_pole(double sink, int skipped, double rate) {
  const double open = std::min<double>(SkippingStone::kOpenHz, 0.45 * rate);
  const double corner = open * std::pow(2.0, -sink * SkippingStone::kSinkOctaves * skipped);
  const double open_pole = std::exp(-2.0 * kPi * open / rate);
  return std::max(0.0, (std::exp(-2.0 * kPi * corner / rate) - open_pole) / (1.0 - open_pole));
}

// The size of the `hz` component of x[from, to) as a sum, not an average: the
// response of whatever made that stretch out of one click.
static double response(const std::vector<float>& x, double hz, size_t from, size_t to) {
  double re = 0.0, im = 0.0;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i - from) / kRate;
    re += x[i] * std::cos(phase);
    im -= x[i] * std::sin(phase);
  }
  return std::sqrt(re * re + im * im);
}

static double energy(const std::vector<float>& x, size_t from, size_t to) {
  double sum = 0.0;
  for (size_t i = from; i < to && i < x.size(); ++i) sum += static_cast<double>(x[i]) * x[i];
  return sum;
}

struct Move {
  size_t at;
  int param;
  float value;
};

// Run in blocks of `block` frames, cut short wherever a knob moves, so the
// knob moves on the same sample at every block size.
static Stereo run_with(SkippingStone& d, const std::vector<float>& left, const std::vector<float>& right,
                       const std::vector<Move>& moves, int block) {
  Stereo out;
  out.left.resize(left.size());
  out.right.resize(left.size());
  size_t done = 0, next = 0;
  int ragged = 0;
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  while (done < left.size()) {
    while (next < moves.size() && moves[next].at <= done) {
      d.set_param(moves[next].param, moves[next].value);
      ++next;
    }
    size_t frames = block > 0 ? static_cast<size_t>(block) : static_cast<size_t>(sizes[ragged++ % 8]);
    frames = std::min(frames, left.size() - done);
    if (next < moves.size()) frames = std::min(frames, moves[next].at - done);
    for (size_t i = 0; i < frames; ++i) {
      d.in_left()[i] = left[done + i];
      d.in_right()[i] = right[done + i];
    }
    d.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

int main() {
  char label[200];

  Conformance spec;
  spec.name = "skipping-stone";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 6.0f;
  check_effect(device, spec, kRate);

  // The landings follow the geometric series: landing k comes
  // First x (1 + Bounce + ... + Bounce^(k-1)) after the click, to the sample,
  // for a throw that closes up, one that is even and one that spreads out.
  for (float bounce : {0.6f, 1.0f, 1.3f}) {
    bare(device);
    device.set_param(p::kFirst, 200.0f);
    device.set_param(p::kBounce, bounce);
    device.set_param(p::kSkips, 10.0f);
    float seconds[SkippingStone::kMaxLandings];
    const int count = SkippingStone::landings(200.0f, bounce, 10, seconds);
    Stereo out = run(device, impulse(9.5f, kRate, kClick));
    // The series by itself, in double precision, against the device's own.
    double gap = 0.2, at = 0.0, worst_time = 0.0;
    int landed = 0;
    for (int k = 0; k < 10; ++k) {
      if (k > 0) gap *= bounce;
      at += gap;
      worst_time = std::max(worst_time, std::fabs(at - seconds[k]));
      const size_t index = static_cast<size_t>(at * kRate + 0.5);
      // On the sample the series gives, give or take the one a rounding can move it.
      double here = 0.0;
      for (size_t i = index - 1; i <= index + 1; ++i) here = std::max(here, std::fabs((double)out.left[i]));
      if (std::fabs(here - kClick * kCentre) < 1.0e-4) ++landed;
      out.left[index - 1] = out.left[index] = out.left[index + 1] = 0.0f;
    }
    out.left[0] = 0.0f;  // the click itself, under Mix at 1
    std::snprintf(label, sizeof label, "Bounce %.1f: ten landings are played (%d) on the samples of the series (%d)",
                  bounce, count, landed);
    EXPECT(count == 10 && landed == 10, label);
    std::snprintf(label, sizeof label, "Bounce %.1f: the device's series is the geometric one (off by %g s)",
                  bounce, worst_time);
    EXPECT(worst_time < 1.0e-5, label);
    std::snprintf(label, sizeof label, "Bounce %.1f: nothing sounds between the landings (peak %g)", bounce,
                  peak(out.left));
    EXPECT(peak(out.left) < 1.0e-9, label);
  }

  // Loss: every landing is that many dB under the one before.
  for (float loss : {1.5f, 6.0f}) {
    bare(device);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 8.0f);
    device.set_param(p::kLoss, loss);
    Stereo out = run(device, impulse(1.0f, kRate, kClick));
    double worst = 0.0;
    for (int k = 1; k < 8; ++k) {
      const double step = db(std::fabs(out.left[4800 * (k + 1)])) - db(std::fabs(out.left[4800 * k]));
      worst = std::max(worst, std::fabs(step + loss));
    }
    std::snprintf(label, sizeof label, "Loss %.1f dB: each landing is that much under the one before (off by %g dB)",
                  loss, worst);
    EXPECT(worst < 0.01, label);
    EXPECT_NEAR(std::fabs(out.left[4800]), kClick * kCentre, 1.0e-5, "the first landing has lost nothing");
  }

  // Sink: each landing goes through two one-poles whose corner falls
  // 0.6 x Sink octaves a skip. One click's landing is their impulse response.
  for (float sink : {0.5f, 1.0f}) {
    bare(device);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 8.0f);
    device.set_param(p::kSink, sink);
    Stereo out = run(device, impulse(1.0f, kRate, kClick));
    double worst = 0.0;
    double bright[8];
    for (int k = 0; k < 8; ++k) {
      const size_t from = 4800 * (k + 1);
      for (double hz : {500.0, 2000.0, 8000.0}) {
        const double measured = response(out.left, hz, from, from + 4000) / (kClick * kCentre);
        const double expected = two_poles(sink_pole(sink, k, kRate), hz, kRate);
        worst = std::max(worst, std::fabs(db(measured) - db(expected)));
      }
      bright[k] = response(out.left, 8000.0, from, from + 4000);
    }
    std::snprintf(label, sizeof label, "Sink %.1f: every landing has the response of its two low-passes (off by %g dB)",
                  sink, worst);
    EXPECT(worst < 0.1, label);
    bool falls = true;
    for (int k = 1; k < 8; ++k) falls = falls && bright[k] < bright[k - 1] * 0.97;
    EXPECT(falls, "Sink: each landing has less at 8 kHz than the one before");
    EXPECT_NEAR(db(bright[0] / (kClick * kCentre)), 0.0, 0.01, "Sink leaves the first landing as bright as it was");
  }

  // Throw: the stone crosses at a steady speed, so a landing sits where the
  // time since the first landing puts it, from one side to the other.
  for (float thrown : {1.0f, -1.0f, 0.5f}) {
    bare(device);
    device.set_param(p::kFirst, 150.0f);
    device.set_param(p::kBounce, 0.75f);
    device.set_param(p::kSkips, 7.0f);
    device.set_param(p::kThrow, thrown);
    float seconds[SkippingStone::kMaxLandings];
    const int count = SkippingStone::landings(150.0f, 0.75f, 7, seconds);
    Stereo out = run(device, impulse(1.0f, kRate, kClick));
    double worst = 0.0, before = -2.0;
    bool onward = true;
    for (int k = 0; k < count; ++k) {
      const size_t index = sample_of(seconds[k]);
      const double left = std::fabs(out.left[index]), right = std::fabs(out.right[index]);
      // Equal-power pan: the angle between the sides is the place, -1 to 1.
      const double place = std::atan2(right, left) / (kPi / 4.0) - 1.0;
      const double expected =
          thrown * (2.0 * (seconds[k] - seconds[0]) / (seconds[count - 1] - seconds[0]) - 1.0);
      worst = std::max(worst, std::fabs(place - expected));
      EXPECT_NEAR(std::sqrt(left * left + right * right), kClick, 1.0e-5, "a landing is as loud wherever it sits");
      if (place * (thrown > 0 ? 1 : -1) <= before) onward = false;
      before = place * (thrown > 0 ? 1 : -1);
    }
    std::snprintf(label, sizeof label, "Throw %.1f: each landing sits where the stone is by then (off by %g)", thrown,
                  worst);
    EXPECT(count == 7 && worst < 1.0e-4, label);
    EXPECT(onward, "Throw: every landing is further across than the one before");
  }
  {
    bare(device);
    device.set_param(p::kThrow, 1.0f);
    Stereo out = run(device, impulse(2.0f, kRate, kClick));
    const size_t first = sample_of(0.32f);
    EXPECT(std::fabs(out.left[first]) > 0.2 && out.right[first] == 0.0f, "Throw at 1: the first landing is hard left");
    float seconds[SkippingStone::kMaxLandings];
    SkippingStone::landings(320.0f, 0.8f, 8, seconds);
    const size_t last = sample_of(seconds[7]);
    EXPECT(std::fabs(out.right[last]) > 0.2 && std::fabs(out.left[last]) < 1.0e-7,
           "Throw at 1: the last landing is hard right");
  }

  // The throw ends. Closing up, the stone sinks once a gap is under 2 ms;
  // spreading out, a landing later than 20 s is not played. Either way the
  // device goes back to sleep.
  {
    bare(device);
    device.set_param(p::kFirst, 20.0f);
    device.set_param(p::kBounce, 0.5f);
    device.set_param(p::kSkips, 16.0f);
    float seconds[SkippingStone::kMaxLandings];
    const int count = SkippingStone::landings(20.0f, 0.5f, 16, seconds);
    EXPECT(count == 4, "gaps of 20, 10, 5 and 2.5 ms are played and 1.25 ms is not");
    Stereo out = run(device, impulse(1.0f, kRate, kClick));
    const size_t last = sample_of(seconds[count - 1]);
    EXPECT(std::fabs(out.left[last]) > 0.1, "the last landing over the floor sounds");
    EXPECT(peak(out.left, last + 1) == 0.0, "nothing lands after the stone has sunk");
    // A steady tone through sixteen landings that never end would grow without a limit; these stop.
    bare(device);
    device.set_param(p::kFirst, 20.0f);
    device.set_param(p::kBounce, 0.5f);
    device.set_param(p::kSkips, 16.0f);
    Stereo tone = run(device, sine(1000.0f, 1.0f, kRate, 0.25f));
    EXPECT(finite(tone.left) && peak(tone.left) <= 4.0 * 0.25 * kCentre + 1.0e-3,
           "a tone through a throw that closes up is no louder than its four landings");
  }
  {
    bare(device);
    device.set_param(p::kFirst, 2000.0f);
    device.set_param(p::kBounce, 1.5f);
    device.set_param(p::kSkips, 16.0f);
    float seconds[SkippingStone::kMaxLandings];
    const int count = SkippingStone::landings(2000.0f, 1.5f, 16, seconds);
    EXPECT(count == 4, "landings at 2, 5, 9.5 and 16.25 s are played and 26.4 s is not");
    Stereo out = run(device, impulse(22.0f, kRate, kClick));
    const size_t last = sample_of(16.25f);
    EXPECT(std::fabs(out.left[last]) > 0.1, "the landing at 16.25 s sounds");
    EXPECT(peak(out.left, last + 1) == 0.0, "nothing lands after it");
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0 && device.meter(1) == -1.0f,
           "asleep once the longest landing and its quarter second have passed");
  }

  // Ripple: a share of each landing is spread into rings by allpasses, so the
  // landing keeps its energy; the share grows by Ripple of what is still
  // sharp at every skip, and the rings of the two sides are not the same.
  {
    bare(device);
    device.set_param(p::kFirst, 800.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 3.0f);
    device.set_param(p::kRipple, 0.5f);
    Stereo out = run(device, impulse(3.4f, kRate, kClick));
    const double whole = kClick * kCentre * kClick * kCentre;
    double sharp = 1.0;
    for (int k = 0; k < 3; ++k) {
      const size_t from = 38400 * (k + 1);
      std::snprintf(label, sizeof label, "Ripple: landing %d keeps its energy", k + 1);
      EXPECT_NEAR(energy(out.left, from, from + 36000) / whole, 1.0, 0.01, label);
      // On the landing's own sample: what is still sharp. The rings begin on the sample after.
      std::snprintf(label, sizeof label, "Ripple: landing %d is as sharp as its share says", k + 1);
      EXPECT_NEAR(out.left[from], kClick * kCentre * std::sqrt(sharp), 1.0e-5, label);
      std::snprintf(label, sizeof label, "Ripple: landing %d has the rest of its energy in the rings", k + 1);
      EXPECT_NEAR(energy(out.left, from + 1, from + 36000) / whole, 1.0 - sharp, 0.01, label);
      // Rings, not one more echo: half of what is in them comes later than 10 ms after the landing.
      if (k > 0) {
        const double late = energy(out.left, from + 480, from + 36000) / (whole * (1.0 - sharp));
        std::snprintf(label, sizeof label, "Ripple: the rings of landing %d spread over time (%g later than 10 ms)",
                      k + 1, late);
        EXPECT(late > 0.5 && late < 1.0, label);
      }
      sharp *= 0.5;
    }
    const size_t third = 38400 * 3;
    const double alike = correlation(out.left, out.right, third + 96, third + 36000);
    std::snprintf(label, sizeof label, "Ripple: the rings of the two sides differ (correlation %g)", alike);
    EXPECT(std::fabs(alike) < 0.5, label);
  }

  // Drop: each skip is read slower by Drop cents. With two skips thrown hard
  // across, the right side is the second landing alone.
  for (float cents : {12.0f, 100.0f, 200.0f}) {
    bare(device);
    device.set_param(p::kFirst, 300.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 2.0f);
    device.set_param(p::kThrow, 1.0f);
    device.set_param(p::kDrop, cents);
    Stereo out = run(device, sine(1000.0f, 6.0f, kRate, 0.25f));
    const double ratio = std::pow(2.0, -cents / 1200.0);
    const double expected = 1000.0 * ratio;
    const double found = dominant_frequency(out.right, kRate, 850.0, 1050.0, 48000, 5 * 48000);
    // Two heads that cross-fade put a steady tone's lines on a grid as fine as
    // the heads splice (the tone's own frequency plus whole splices), so the
    // strongest line is the one nearest the pitch asked for: within half a splice.
    const double window = std::min<double>((1.0 - ratio) * kRate / SkippingStone::kSpliceHz,
                                           SkippingStone::kMaxWindowSeconds * kRate);
    const double splice = (1.0 - ratio) * kRate / window;
    std::snprintf(label, sizeof label, "Drop %.0f ct: the second landing plays at %.2f Hz (found %.2f, splice %.2f Hz)",
                  cents, expected, found, splice);
    EXPECT(std::fabs(found - expected) < 0.5 * splice + 0.1, label);
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 850.0, 1050.0, 48000, 5 * 48000), 1000.0, 0.05,
                "Drop leaves the first landing at its pitch");
    EXPECT(rms(out.right, 48000, 5 * 48000) > 0.25 * 0.5, "the dropped landing is about as loud as it was");
  }
  {
    // A few cents move a landing by less than half its window: 5 ct is a window of 11.5 ms.
    bare(device);
    device.set_param(p::kFirst, 300.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 2.0f);
    device.set_param(p::kThrow, 1.0f);
    device.set_param(p::kDrop, 5.0f);
    Stereo out = run(device, impulse(1.0f, kRate, kClick));
    size_t loudest = 0;
    for (size_t i = 0; i < out.right.size(); ++i) {
      if (std::fabs(out.right[i]) > std::fabs(out.right[loudest])) loudest = i;
    }
    const double window = (1.0 - std::pow(2.0, -5.0 / 1200.0)) * kRate / SkippingStone::kSpliceHz;
    std::snprintf(label, sizeof label, "Drop 5 ct: the second landing is %ld samples from its time, window %g",
                  static_cast<long>(loudest) - 28800, window);
    EXPECT(std::fabs(static_cast<double>(loudest) - 28800.0) <= window / 2.0 + 2.0, label);
  }

  // Again: the last landing, before its Loss, is thrown again at that gain.
  {
    bare(device);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 3.0f);
    device.set_param(p::kLoss, 6.0f);
    device.set_param(p::kAgain, 0.5f);
    Stereo out = run(device, impulse(2.0f, kRate, kClick));
    const double first = kClick * kCentre;
    const double lost = std::pow(10.0, -6.0 / 20.0);
    EXPECT_NEAR(out.left[4800], first, 1.0e-5, "Again: the first throw is what it was");
    EXPECT_NEAR(out.left[14400], first * lost * lost, 1.0e-5, "Again: and so is its last landing");
    EXPECT_NEAR(out.left[14400 + 4800], first * 0.5, 1.0e-5, "Again: the second throw starts where the first stopped");
    EXPECT_NEAR(out.left[14400 + 9600], first * 0.5 * lost, 1.0e-5, "Again: and skips as the first did");
    EXPECT_NEAR(out.left[2 * 14400 + 4800], first * 0.25, 1.0e-5, "Again: the third throw is as much softer again");
  }
  {
    // As much as it can be asked for, with a full-scale tone the landings add up on: bounded, and it dies away.
    device.init(kRate);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 16.0f);
    device.set_param(p::kLoss, 0.0f);
    device.set_param(p::kSink, 0.0f);
    device.set_param(p::kThrow, 0.0f);
    device.set_param(p::kAgain, 0.95f);
    device.set_param(p::kMix, 1.0f);
    Stereo loud = run(device, sine(110.0f, 20.0f, kRate, 1.0f));
    std::snprintf(label, sizeof label, "Again at its most with a full-scale tone stays bounded (peak %g)",
                  peak(loud.left));
    // Sixteen landings of a ring held to full scale, each sharp and in its rings at once.
    EXPECT(finite(loud.left) && finite(loud.right) && peak(loud.left) < 32.0, label);
    Stereo tail = render(device, 60.0f, kRate);
    const double early = rms(tail.left, 0, 5 * 48000), late = rms(tail.left, 55 * 48000, 60 * 48000);
    std::snprintf(label, sizeof label, "Again at its most dies away once the sound stops (%g to %g)", early, late);
    EXPECT(finite(tail.left) && late < early * 0.5 && late > 0.0, label);
  }

  // Mix at 0 is the input, sample for sample, whatever else is set.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    device.set_param(p::kAgain, 0.9f);
    device.set_param(p::kDrop, 80.0f);
    rng_state() = 0xA11CEu;
    std::vector<float> left = noise(1.0f, kRate, 0.9f), right = noise(1.0f, kRate, 0.9f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 is the input, sample for sample");
  }

  // Bad input: samples that are not numbers, or absurd, pass and are gone.
  {
    device.init(kRate);
    device.set_param(p::kAgain, 0.5f);
    device.set_param(p::kDrop, 40.0f);
    rng_state() = 0xBADu;
    std::vector<float> good = noise(1.0f, kRate, 0.3f);
    std::vector<float> bad = noise(0.2f, kRate, 0.3f);
    const float inf = std::numeric_limits<float>::infinity();
    const float poison[] = {std::nanf(""), inf, -inf, 1.0e30f, -1.0e30f};
    for (size_t i = 0; i < bad.size(); i += 3) bad[i] = poison[(i / 3) % 5];
    std::vector<float> other = bad;
    for (size_t i = 0; i < other.size(); i += 6) other[i] = -other[i];
    run(device, good);
    run(device, bad, other);
    Stereo after = run(device, good);
    std::snprintf(label, sizeof label, "after bad samples the output is numbers again (peak %g)",
                  std::max(peak(after.left), peak(after.right)));
    // The dry part is the input; the landings hold at most sixteen clipped samples each.
    EXPECT(finite(after.left) && finite(after.right) && peak(after.left) < 6.0 && peak(after.right) < 6.0, label);
    // Not stuck: it still skips, and it still comes to rest.
    Stereo tail = render(device, 3.0f, kRate);
    EXPECT(finite(tail.left) && rms(tail.left, 0, 48000) > 1.0e-3, "after bad samples the landings still sound");
    render(device, 60.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "after bad samples it still comes to rest");
    bare(device);
    Stereo clean = run(device, impulse(0.5f, kRate, kClick));
    EXPECT_NEAR(clean.left[15360], kClick * kCentre, 1.0e-5, "and a click then lands as it should");
  }

  // The same sound at every block size, across silences around the moment it
  // falls asleep, with the Drop heads running and knobs moved in each silence.
  {
    // When it falls asleep after a burst, found by asking it.
    rng_state() = 0x51EE9u;
    std::vector<float> first_burst = noise(0.12f, kRate, 0.4f);
    device.init(kRate);
    device.set_param(p::kDrop, 30.0f);
    run(device, first_burst);
    size_t asleep_after = 0;
    while (device.meter(1) >= 0.0f && asleep_after < 20 * 48000) {
      device.process(16);
      asleep_after += 16;
    }
    const float sleeps = static_cast<float>(asleep_after) / kRate;
    std::snprintf(label, sizeof label, "it falls asleep %.3f s after a burst: after its last landing, within 3 s", sleeps);
    EXPECT(sleeps > 1.33f + 0.25f && sleeps < 3.0f, label);

    rng_state() = 0x51EE9u;
    std::vector<float> gaps = {0.5f, 1.2f, sleeps + 1.5f};
    for (int n = -8; n <= 8; ++n) gaps.push_back(sleeps + 0.011f * static_cast<float>(n));
    std::vector<float> phrase;
    std::vector<Move> moves;
    int turn = 0;
    for (float gap : gaps) {
      std::vector<float> burst = noise(0.12f, kRate, 0.4f);
      phrase.insert(phrase.end(), burst.begin(), burst.end());
      phrase.resize(phrase.size() + static_cast<size_t>(gap * kRate), 0.0f);
      // Twenty milliseconds before the next burst: three knobs to somewhere else.
      const size_t at = phrase.size() - 960;
      moves.push_back({at, p::kLoss, turn % 2 == 0 ? 5.0f : 2.5f});
      moves.push_back({at, p::kThrow, turn % 2 == 0 ? -0.4f : 0.6f});
      moves.push_back({at, p::kMix, turn % 2 == 0 ? 0.7f : 0.35f});
      ++turn;
    }
    std::vector<float> burst = noise(0.12f, kRate, 0.4f);
    phrase.insert(phrase.end(), burst.begin(), burst.end());
    phrase.resize(phrase.size() + 96000, 0.0f);
    Stereo reference;
    for (int block : {128, 1, 2048, 0}) {
      device.init(kRate);
      device.set_param(p::kDrop, 30.0f);
      Stereo out = run_with(device, phrase, phrase, moves, block);
      if (block == 128) {
        reference = out;
        continue;
      }
      const double worst = worst_difference(out, reference);
      std::snprintf(label, sizeof label, "blocks of %d give the sound of blocks of 128 across every silence (off by %g)",
                    block, worst);
      EXPECT(worst < 1.0e-6, label);
    }
  }

  // A knob moved while it sleeps is there when it wakes: the next sound is
  // what a device that started with that setting makes of it.
  {
    rng_state() = 0xC0FFEEu;
    std::vector<float> burst = noise(0.5f, kRate, 0.4f);
    device.init(kRate);
    run(device, burst);
    render(device, 8.0f, kRate);
    device.set_param(p::kFirst, 90.0f);
    device.set_param(p::kLoss, 6.0f);
    device.set_param(p::kThrow, -1.0f);
    device.set_param(p::kDrop, 60.0f);
    device.set_param(p::kMix, 0.8f);
    Stereo woken = run(device, burst);
    device.init(kRate);
    device.set_param(p::kFirst, 90.0f);
    device.set_param(p::kLoss, 6.0f);
    device.set_param(p::kThrow, -1.0f);
    device.set_param(p::kDrop, 60.0f);
    device.set_param(p::kMix, 0.8f);
    Stereo fresh = run(device, burst);
    EXPECT(woken.left == fresh.left && woken.right == fresh.right,
           "knobs moved while asleep stand where they were put when it wakes");
  }

  // Moving a knob while a tone sounds does not click: no step larger than the
  // tone itself makes with the knob left alone.
  {
    struct Sweep {
      const char* name;
      int param;
      float from, to;
    };
    const Sweep sweeps[] = {
        {"First", p::kFirst, 320.0f, 700.0f},   {"Bounce", p::kBounce, 0.8f, 1.2f},
        {"Skips", p::kSkips, 8.0f, 3.0f},       {"Skips up", p::kSkips, 3.0f, 14.0f},
        {"Loss", p::kLoss, 2.5f, 9.0f},         {"Sink", p::kSink, 0.3f, 1.0f},
        {"Drop", p::kDrop, 0.0f, 120.0f},       {"Drop back", p::kDrop, 120.0f, 0.0f},
        {"Throw", p::kThrow, 0.6f, -1.0f},      {"Ripple", p::kRipple, 0.35f, 1.0f},
        {"Again", p::kAgain, 0.0f, 0.9f},       {"Mix", p::kMix, 0.35f, 1.0f},
    };
    std::vector<float> tone = sine(220.0f, 4.0f, kRate, 0.5f);
    for (const Sweep& sweep : sweeps) {
      // The reference has no event in it: the knob stands at the louder end throughout.
      double calm = 0.0;
      for (float value : {sweep.from, sweep.to}) {
        device.init(kRate);
        device.set_param(sweep.param, value);
        Stereo still = run(device, tone);
        calm = std::max(calm, std::max(max_step(still.left, 96000), max_step(still.right, 96000)));
      }
      device.init(kRate);
      device.set_param(sweep.param, sweep.from);
      // One jump, then a knob turned by hand: forty moves over a second.
      std::vector<Move> moves = {{96000, sweep.param, sweep.to}, {110400, sweep.param, sweep.from}};
      for (int n = 1; n <= 40; ++n) {
        moves.push_back({124800 + static_cast<size_t>(n) * 1200, sweep.param,
                         sweep.from + (sweep.to - sweep.from) * static_cast<float>(n) / 40.0f});
      }
      Stereo moved = run_with(device, tone, tone, moves, 128);
      const double step = std::max(max_step(moved.left, 96000), max_step(moved.right, 96000));
      std::snprintf(label, sizeof label, "%s moved while a tone sounds does not click (step %g, %g at rest)",
                    sweep.name, step, calm);
      EXPECT(step < calm * 1.25 + 0.002, label);
    }
  }

  // At its defaults it is not louder than what goes in by more than a few dB.
  {
    device.init(kRate);
    rng_state() = 0xFACEu;
    std::vector<float> steady = noise(8.0f, kRate, 0.25f);
    Stereo out = run(device, steady);
    const double gain = db(rms(out.left, 96000) / rms(steady, 96000));
    std::snprintf(label, sizeof label, "at its defaults steady noise comes out %.2f dB louder", gain);
    EXPECT(gain > -1.0 && gain < 3.0, label);
  }

  // Other sample rates: the landings come at the same times.
  for (float rate : {44100.0f, 96000.0f}) {
    bare(device, rate);
    Stereo out = run(device, impulse(2.0f, rate, kClick));
    float seconds[SkippingStone::kMaxLandings];
    const int count = SkippingStone::landings(320.0f, 0.8f, 8, seconds);
    int landed = 0;
    for (int k = 0; k < count; ++k) {
      if (std::fabs(std::fabs(out.left[sample_of(seconds[k], rate)]) - kClick * kCentre) < 1.0e-4) ++landed;
    }
    std::snprintf(label, sizeof label, "at %.0f Hz the eight landings come at the same times (%d)", rate, landed);
    EXPECT(landed == 8, label);
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("skipping-stone", 10.0f, kRate, [&] { run(device, input); });
  // The most it does: sixteen landings, each read by two Drop heads, all in the rings, thrown again.
  device.init(kRate);
  device.set_param(p::kSkips, 16.0f);
  device.set_param(p::kBounce, 0.95f);
  device.set_param(p::kDrop, 200.0f);
  device.set_param(p::kRipple, 1.0f);
  device.set_param(p::kAgain, 0.9f);
  report_cost("skipping-stone at its most", 10.0f, kRate, [&] { run(device, input); });

  return finish("skipping-stone");
}
