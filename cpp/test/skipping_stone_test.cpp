// Native harness for Skipping Stone (cpp/devices/skipping-stone). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest asserts what makes it a stone
// skipping over water: when the landings come, how loud, how dull, how low
// and where, when the throw ends, what Ripple and Again do to it, and that
// a held sound comes out of it about as loud as it went in at every setting.

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
// A centred landing is on both sides at this share of its gain (equal power).
static const double kCentre = 0.70710678;

// What the first landing of a throw has on each side when it sits in the
// middle (skipping_stone.h, level): the landings share the power of what was
// thrown, so it depends on how many they are and on Loss.
static double first_of(float loss_db, int count, float again = 0.0f) {
  return kCentre * SkippingStone::level(loss_db, count, again);
}
// The same, worked out here and not by the device: the sum of the landings'
// powers is that of the sound on both sides.
static double first_by_hand(double loss_db, int count) {
  double power = 0.0;
  for (int k = 0; k < count; ++k) power += std::pow(10.0, -loss_db * k / 10.0);
  return 1.0 / std::sqrt(power);
}

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

// The corner Sink gives the landing after `skipped` skips, and the pole of
// each of its two low-passes (skipping_stone.h, retarget and sink_pole).
static double sink_corner(double sink, int skipped) {
  return SkippingStone::kOpenHz * std::pow(2.0, -sink * SkippingStone::kSinkOctaves * skipped);
}
static double sink_pole(double sink, int skipped, double rate) {
  return SkippingStone::sink_pole(static_cast<float>(sink_corner(sink, skipped)), static_cast<float>(rate));
}

// The level of x in windows of `seconds`, half over half, between two times:
// the lowest and the highest against the middle one, in dB.
static void levels(const std::vector<float>& x, double from, double to, double seconds, double* lowest,
                   double* highest) {
  std::vector<double> found;
  const size_t window = static_cast<size_t>(seconds * kRate);
  for (size_t at = static_cast<size_t>(from * kRate); at + window <= static_cast<size_t>(to * kRate); at += window / 2) {
    found.push_back(db(rms(x, at, at + window)));
  }
  std::sort(found.begin(), found.end());
  const double middle = found[found.size() / 2];
  *lowest = found.front() - middle;
  *highest = found.back() - middle;
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
  spec.max_peak = 4.0f;
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
      if (std::fabs(here - kClick * first_of(0.0f, 10)) < 1.0e-4) ++landed;
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
    EXPECT_NEAR(std::fabs(out.left[4800]), kClick * first_of(loss, 8), 1.0e-5, "the first landing has lost nothing");
    // The level worked out by hand: the eight landings together carry the power of the click.
    std::snprintf(label, sizeof label, "Loss %.1f dB: the first landing is 1 / sqrt(the sum of the landings' powers)", loss);
    EXPECT_NEAR(std::fabs(out.left[4800]) / kClick, first_by_hand(loss, 8), 1.0e-4, label);
    double power = 0.0;
    for (int k = 0; k < 8; ++k) {
      power += static_cast<double>(out.left[4800 * (k + 1)]) * out.left[4800 * (k + 1)] +
               static_cast<double>(out.right[4800 * (k + 1)]) * out.right[4800 * (k + 1)];
    }
    std::snprintf(label, sizeof label, "Loss %.1f dB: the throw as a whole has the power of what was thrown on both sides", loss);
    EXPECT_NEAR(power / (2.0 * kClick * kClick), 1.0, 1.0e-3, label);
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
        const double measured = response(out.left, hz, from, from + 4000) / (kClick * first_of(0.0f, 8));
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
    EXPECT_NEAR(db(bright[0] / (kClick * first_of(0.0f, 8))), 0.0, 0.01, "Sink leaves the first landing as bright as it was");
  }
  // The corner is where the header says at every sample rate: with Sink at 1
  // the sixth landing's is three octaves under 20 kHz, 2.5 kHz, and each of
  // its two low-passes is 3 dB down there. (The pole was taken from the
  // corner in a way that put it 8 % too high at 48 kHz and 27 % at 96 kHz.)
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    bare(device, rate);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 8.0f);
    device.set_param(p::kSink, 1.0f);
    Stereo out = run(device, impulse(1.0f, rate, kClick));
    for (int k : {3, 5, 7}) {
      const size_t from = static_cast<size_t>(0.1f * rate * static_cast<float>(k + 1) + 0.5f);
      const double corner = sink_corner(1.0, k);
      double re = 0.0, im = 0.0;
      for (size_t i = from; i < from + static_cast<size_t>(0.09f * rate); ++i) {
        const double phase = 2.0 * kPi * corner * static_cast<double>(i - from) / rate;
        re += out.left[i] * std::cos(phase);
        im -= out.left[i] * std::sin(phase);
      }
      const double down = db(std::sqrt(re * re + im * im) / (kClick * first_of(0.0f, 8)));
      std::snprintf(label, sizeof label, "Sink at %.0f Hz: landing %d is 6 dB down at its corner, %.0f Hz (found %.2f dB)", rate,
                    k + 1, corner, down);
      EXPECT(std::fabs(down + 6.02) < 0.25, label);
    }
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
      EXPECT_NEAR(std::sqrt(left * left + right * right), kClick * SkippingStone::level(0.0f, 7, 0.0f), 1.0e-5,
                  "a landing is as loud wherever it sits");
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
    const double whole = kClick * SkippingStone::level(0.0f, 8, 0.0f);
    EXPECT(std::fabs(out.left[first]) > 0.99 * whole && out.right[first] == 0.0f, "Throw at 1: the first landing is hard left");
    float seconds[SkippingStone::kMaxLandings];
    SkippingStone::landings(320.0f, 0.8f, 8, seconds);
    const size_t last = sample_of(seconds[7]);
    EXPECT(std::fabs(out.right[last]) > 0.99 * whole && std::fabs(out.left[last]) < 1.0e-7,
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
    EXPECT(std::fabs(out.left[last]) > 0.08, "the last landing over the floor sounds");
    EXPECT(peak(out.left, last + 1) == 0.0, "nothing lands after the stone has sunk");
    // A steady tone through sixteen landings that never end would grow without a limit; these stop.
    bare(device);
    device.set_param(p::kFirst, 20.0f);
    device.set_param(p::kBounce, 0.5f);
    device.set_param(p::kSkips, 16.0f);
    Stereo tone = run(device, sine(1000.0f, 1.0f, kRate, 0.25f));
    EXPECT(finite(tone.left) && peak(tone.left) <= 4.0 * 0.25 * first_of(0.0f, 4) + 1.0e-3,
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
    EXPECT(std::fabs(out.left[last]) > 0.08, "the landing at 16.25 s sounds");
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
    const double one = kClick * first_of(0.0f, 3);
    const double whole = one * one;
    double sharp = 1.0;
    for (int k = 0; k < 3; ++k) {
      const size_t from = 38400 * (k + 1);
      std::snprintf(label, sizeof label, "Ripple: landing %d keeps its energy", k + 1);
      EXPECT_NEAR(energy(out.left, from, from + 36000) / whole, 1.0, 0.01, label);
      // On the landing's own sample: what is still sharp. The rings begin on the sample after.
      std::snprintf(label, sizeof label, "Ripple: landing %d is as sharp as its share says", k + 1);
      EXPECT_NEAR(out.left[from], one * std::sqrt(sharp), 1.0e-5, label);
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
    const double expected = 1000.0 * std::pow(2.0, -cents / 1200.0);
    const double found = dominant_frequency(out.right, kRate, 850.0, 1050.0, 48000, 5 * 48000);
    // One head, spliced in phase: the tone goes on at its own pitch through
    // every splice, so the line is where the pitch is, not on a grid of splices.
    std::snprintf(label, sizeof label, "Drop %.0f ct: the second landing plays at %.2f Hz (found %.2f)", cents, expected,
                  found);
    EXPECT(std::fabs(found - expected) < 0.15, label);
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 850.0, 1050.0, 48000, 5 * 48000), 1000.0, 0.05,
                "Drop leaves the first landing at its pitch");
    // A held tone keeps its level through the splices. (Two heads that
    // cross-faded all the time dipped it by 10 dB wherever they met out of phase.)
    double lowest, highest;
    levels(out.right, 1.0, 5.9, 0.02, &lowest, &highest);
    std::snprintf(label, sizeof label, "Drop %.0f ct: a held tone keeps its level (20 ms windows within %+.2f and %+.2f dB)",
                  cents, lowest, highest);
    EXPECT(lowest > -0.5 && highest < 0.5, label);
    const double plain = 0.25 * SkippingStone::level(0.0f, 2, 0.0f) / std::sqrt(2.0);
    std::snprintf(label, sizeof label, "Drop %.0f ct: the dropped landing is as loud as it was (%.2f dB)", cents,
                  db(rms(out.right, 48000, 5 * 48000) / plain));
    EXPECT(std::fabs(db(rms(out.right, 48000, 5 * 48000) / plain)) < 0.3, label);
  }
  {
    // A low held tone, whose period is long beside the splice: the same.
    // (At 220 Hz the two heads met out of phase and the tone fell by 10 dB, four times a second.)
    for (float cents : {40.0f, 100.0f, 200.0f}) {
      bare(device);
      device.set_param(p::kFirst, 300.0f);
      device.set_param(p::kBounce, 1.0f);
      device.set_param(p::kSkips, 2.0f);
      device.set_param(p::kThrow, 1.0f);
      device.set_param(p::kDrop, cents);
      Stereo out = run(device, sine(220.0f, 8.0f, kRate, 0.25f));
      double lowest, highest;
      levels(out.right, 1.0, 7.9, 0.02, &lowest, &highest);
      std::snprintf(label, sizeof label, "Drop %.0f ct: a held 220 Hz tone keeps its level (20 ms windows within %+.2f and %+.2f dB)",
                    cents, lowest, highest);
      EXPECT(lowest > -0.5 && highest < 0.5, label);
    }
  }
  {
    // Noise, which no place in the ring is like: the splice is the equal-power
    // one, and the level holds there too. (It fell by 3.5 dB twice a window.)
    for (float cents : {12.0f, 200.0f}) {
      bare(device);
      device.set_param(p::kFirst, 300.0f);
      device.set_param(p::kBounce, 1.0f);
      device.set_param(p::kSkips, 2.0f);
      device.set_param(p::kThrow, 1.0f);
      device.set_param(p::kDrop, cents);
      rng_state() = 0xD120Bu;
      Stereo out = run(device, noise(8.0f, kRate, 0.2f));
      double lowest, highest;
      levels(out.right, 1.0, 7.9, 0.02, &lowest, &highest);
      std::snprintf(label, sizeof label, "Drop %.0f ct: noise keeps its level through the splices (20 ms windows %+.2f to %+.2f dB)",
                    cents, lowest, highest);
      EXPECT(lowest > -1.5 && highest < 1.5, label);
    }
  }
  {
    // A click comes back once, and within half a window of the landing's own
    // time. (Through two heads it came back twice, up to 30 ms apart.) Thrown
    // at three moments, so the head is at three places in its window.
    for (float cents : {5.0f, 100.0f, 200.0f}) {
      const double ratio = std::pow(2.0, -cents / 1200.0);
      const double window = std::min<double>(
          std::max<double>((1.0 - ratio) * kRate / SkippingStone::kSpliceHz, SkippingStone::kMinWindowSeconds * kRate),
          SkippingStone::kMaxWindowSeconds * kRate);
      for (size_t at : {size_t(1), size_t(17777), size_t(40001)}) {
        bare(device);
        device.set_param(p::kFirst, 300.0f);
        device.set_param(p::kBounce, 1.0f);
        device.set_param(p::kSkips, 2.0f);
        device.set_param(p::kThrow, 1.0f);
        device.set_param(p::kDrop, cents);
        std::vector<float> in = silence(2.0f, kRate);
        in[0] = 1.0e-4f;  // awake from the start, so the head has run for `at` samples
        in[at] = kClick;
        Stereo out = run(device, in);
        size_t loudest = at;
        for (size_t i = at; i < out.right.size(); ++i) {
          if (std::fabs(out.right[i]) > std::fabs(out.right[loudest])) loudest = i;
        }
        // Whatever is not within four samples of the loudest: nothing of the click.
        double elsewhere = 0.0;
        for (size_t i = at; i < out.right.size(); ++i) {
          if (i + 4 < loudest || i > loudest + 4) elsewhere = std::max(elsewhere, std::fabs(static_cast<double>(out.right[i])));
        }
        const double late = static_cast<double>(loudest) - static_cast<double>(at) - 28800.0;
        std::snprintf(label, sizeof label,
                      "Drop %.0f ct: a click thrown at %ld comes back once (%.3f, elsewhere %.4f), %.0f samples from its time, half window %.0f",
                      cents, static_cast<long>(at), std::fabs(out.right[loudest]), elsewhere, late, window / 2.0);
        EXPECT(std::fabs(out.right[loudest]) > 0.6 * kClick * SkippingStone::level(0.0f, 2, 0.0f) &&
                   elsewhere < 0.02 * std::fabs(out.right[loudest]) && std::fabs(late) <= window / 2.0 + 2.0,
               label);
      }
    }
  }
  {
    // A landing five seconds back is read as cleanly as one a third of a
    // second back: what is left of a 1 kHz tone once the best-fitting tone is
    // taken out. (A head's place was one float, which holds a thirty-second
    // of a sample that far back.)
    double left_over[2] = {0.0, 0.0};
    for (int far = 0; far < 2; ++far) {
      bare(device);
      device.set_param(p::kFirst, far ? 2000.0f : 150.0f);
      device.set_param(p::kBounce, far ? 1.5f : 1.0f);
      device.set_param(p::kSkips, 2.0f);
      device.set_param(p::kThrow, 1.0f);
      device.set_param(p::kDrop, 200.0f);
      Stereo out = run(device, sine(1000.0f, 9.0f, kRate, 0.25f));
      const double hz = 1000.0 * std::pow(2.0, -200.0 / 1200.0);
      double best = 1.0;
      for (size_t from = 6 * 48000; from + 1920 < out.right.size(); from += 960) {
        // Least squares for a tone at hz and one a little off (the fit takes up what the grid misses).
        for (double off = -0.4; off <= 0.4; off += 0.1) {
          double cc = 0, ss = 0, cs = 0, xc = 0, xs = 0, xx = 0;
          for (size_t i = from; i < from + 1920; ++i) {
            const double phase = 2.0 * kPi * (hz + off) * static_cast<double>(i - from) / kRate;
            const double c = std::cos(phase), sn = std::sin(phase), x = out.right[i];
            cc += c * c; ss += sn * sn; cs += c * sn; xc += x * c; xs += x * sn; xx += x * x;
          }
          const double det = cc * ss - cs * cs;
          const double a = (xc * ss - xs * cs) / det, b = (xs * cc - xc * cs) / det;
          best = std::min(best, (xx - a * xc - b * xs) / xx);
        }
      }
      left_over[far] = 10.0 * std::log10(best + 1.0e-20);
    }
    std::snprintf(label, sizeof label, "Drop: a landing 5 s back is as clean as one 0.3 s back (%.1f and %.1f dB left over)",
                  left_over[1], left_over[0]);
    EXPECT(left_over[1] < -75.0 && left_over[1] < left_over[0] + 6.0, label);
  }
  {
    // Drop turned off sends each head home: after that the landings are the plain taps, to the sample.
    bare(device);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kSkips, 6.0f);
    device.set_param(p::kDrop, 150.0f);
    rng_state() = 0x0FFu;
    std::vector<float> in = noise(4.0f, kRate, 0.2f);
    std::vector<Move> off = {{48000, p::kDrop, 0.0f}};
    Stereo moved = run_with(device, in, in, off, 128);
    bare(device);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kSkips, 6.0f);
    Stereo plain = run(device, in);
    double worst = 0.0;
    for (size_t i = 2 * 48000; i < in.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(moved.left[i]) - plain.left[i]));
    }
    std::snprintf(label, sizeof label, "Drop turned off: a second later every landing is the plain tap again (off by %g)", worst);
    EXPECT(worst < 1.0e-6, label);
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
    const double first = kClick * first_of(6.0f, 3, 0.5f);
    const double lost = std::pow(10.0, -6.0 / 20.0);
    // What goes round the loop has lost what is under 8 Hz: of a click, a thousandth.
    const double low = 1.0 - (1.0 - std::exp(-2.0 * kPi * SkippingStone::kLoopLowHz / kRate));
    EXPECT_NEAR(out.left[4800], first, 1.0e-5, "Again: the first throw is what it was");
    EXPECT_NEAR(out.left[14400], first * lost * lost, 1.0e-5, "Again: and so is its last landing");
    EXPECT_NEAR(out.left[14400 + 4800], first * 0.5 * low, 1.0e-5, "Again: the second throw starts where the first stopped");
    EXPECT_NEAR(out.left[14400 + 9600], first * 0.5 * lost * low, 1.0e-5, "Again: and skips as the first did");
    EXPECT_NEAR(out.left[2 * 14400 + 4800], first * 0.25 * low * low, 2.0e-5, "Again: the third throw is as much softer again");
    // Sound with gaps in it is not held: at Again 0.95 too, each throw is that much softer than the one before.
    bare(device);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 3.0f);
    device.set_param(p::kAgain, 0.95f);
    Stereo long_out = run(device, impulse(4.0f, kRate, kClick));
    const double one = kClick * first_of(0.0f, 3, 0.95f);
    double worst = 0.0;
    for (int n = 0; n < 9; ++n) {
      const double expected = one * std::pow(0.95 * low, n);
      worst = std::max(worst, std::fabs(db(std::fabs(long_out.left[n * 14400 + 4800]) / expected)));
    }
    std::snprintf(label, sizeof label, "Again 0.95: nine throws of one click are each 0.95 of the one before (off by %g dB)", worst);
    EXPECT(worst < 0.02, label);
  }
  {
    // The loop passes no DC back. (An offset of 0.01 came out as 0.2.)
    bare(device);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 4.0f);
    device.set_param(p::kAgain, 0.95f);
    std::vector<float> offset(40 * 48000, 0.01f);
    Stereo out = run(device, offset);
    // The four landings of the offset itself, and nothing on top.
    const double landings_only = 0.01 * 4.0 * first_of(0.0f, 4, 0.95f);
    std::snprintf(label, sizeof label, "Again 0.95: an offset of 0.01 does not add up in the loop (%.4f out, %.4f from its four landings)",
                  mean(out.left, 35 * 48000), landings_only);
    EXPECT(mean(out.left, 35 * 48000) < landings_only * 1.05 + 1.0e-4, label);
  }

  // Level. A held sound comes out of the skips about as loud as it went in,
  // at every setting: the landings share the power of what was thrown.
  {
    struct Setting {
      const char* name;
      float first, bounce, skips, loss, again;
    };
    const Setting settings[] = {
        {"two skips, Loss 12", 100.0f, 1.0f, 2.0f, 12.0f, 0.0f},   {"eight skips, Loss 2.5", 320.0f, 0.8f, 8.0f, 2.5f, 0.0f},
        {"sixteen skips, no Loss", 100.0f, 1.0f, 16.0f, 0.0f, 0.0f}, {"sixteen closing up, no Loss", 200.0f, 0.8f, 16.0f, 0.0f, 0.0f},
        {"four skips, Again 0.7", 50.0f, 0.9f, 4.0f, 2.0f, 0.7f},    {"sixteen skips, no Loss, Again 0.95", 50.0f, 1.0f, 16.0f, 0.0f, 0.95f},
    };
    rng_state() = 0x1E7E1u;
    std::vector<float> steady = noise(30.0f, kRate, 0.1f);
    for (const Setting& setting : settings) {
      bare(device);
      device.set_param(p::kFirst, setting.first);
      device.set_param(p::kBounce, setting.bounce);
      device.set_param(p::kSkips, setting.skips);
      device.set_param(p::kLoss, setting.loss);
      device.set_param(p::kAgain, setting.again);
      Stereo out = run(device, steady);
      const double gain = db(rms(out.left, 22 * 48000) / rms(steady, 22 * 48000));
      std::snprintf(label, sizeof label, "level: steady noise through %s comes out of the skips at %+.2f dB", setting.name, gain);
      // (Sixteen skips with no Loss were 9 dB over; with Again at 0.95, 19 dB.)
      EXPECT(std::fabs(gain) < 0.5, label);
    }
  }
  {
    // The worst there is: a quiet tone every landing of an even throw brings
    // back in step, thrown again at 0.95 in step too. Each landing is a whole
    // number of its periods late (100 ms and 110 Hz), so sixteen of them add
    // up to four times one throw's level, and the loop to twenty times that.
    // The two holds keep it within 3 dB of the tone, for good. (It came out
    // 45 dB louder: a tone at 0.05 peaked at 8.)
    bare(device);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 16.0f);
    device.set_param(p::kAgain, 0.95f);
    std::vector<float> tone = sine(110.0f, 90.0f, kRate, 0.05f);
    Stereo out = run(device, tone);
    const double early = db(rms(out.left, 9 * 48000, 10 * 48000) / rms(tone, 0, 48000));
    const double late = db(rms(out.left, 89 * 48000, 90 * 48000) / rms(tone, 0, 48000));
    std::snprintf(label, sizeof label, "level: a held tone in step with every landing and with Again 0.95 is %+.2f dB after 10 s, %+.2f dB after 90 s",
                  early, late);
    EXPECT(early < 3.5 && late < 3.5 && late > -1.0, label);
    // And at full scale, with every landing in its rings as well.
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
    std::snprintf(label, sizeof label, "level: a full-scale tone at that setting peaks at %.2f once the holds have closed (it was 21.96)",
                  peak(loud.left, 5 * 48000));
    EXPECT(finite(loud.left) && finite(loud.right) && peak(loud.left, 5 * 48000) < 2.0 && peak(loud.left) < 3.0, label);
    Stereo tail = render(device, 60.0f, kRate);
    const double first = rms(tail.left, 0, 5 * 48000), last = rms(tail.left, 55 * 48000, 60 * 48000);
    std::snprintf(label, sizeof label, "Again at its most dies away once the sound stops (%g to %g)", first, last);
    EXPECT(finite(tail.left) && last < first * 0.5 && last > 0.0, label);
  }
  {
    // The ceiling is for each side, not for the two together: with the loud
    // early landings thrown to the left, a tone in step with them piles up
    // there. (Held by the mean of the two sides, the left came out 5 dB over.)
    bare(device);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kBounce, 1.0f);
    device.set_param(p::kSkips, 16.0f);
    device.set_param(p::kLoss, 1.0f);
    device.set_param(p::kThrow, 1.0f);
    std::vector<float> tone = sine(110.0f, 12.0f, kRate, 0.05f);
    Stereo out = run(device, tone);
    const double left = db(rms(out.left, 8 * 48000) / rms(tone, 8 * 48000));
    const double right = db(rms(out.right, 8 * 48000) / rms(tone, 8 * 48000));
    std::snprintf(label, sizeof label, "level: a tone in step with landings thrown across is %+.2f dB on the left, %+.2f dB on the right", left,
                  right);
    EXPECT(left < 3.3 && right < 3.3 && left > 2.0, label);
    // And a side that is loud by itself is left alone: two skips, all the
    // Loss there is, thrown hard across, puts 1.88 of the power on the left.
    bare(device);
    device.set_param(p::kFirst, 100.0f);
    device.set_param(p::kSkips, 2.0f);
    device.set_param(p::kLoss, 12.0f);
    device.set_param(p::kThrow, 1.0f);
    rng_state() = 0x51DEu;
    std::vector<float> steady = noise(20.0f, kRate, 0.1f);
    Stereo sided = run(device, steady);
    const double loud = db(rms(sided.left, 10 * 48000) / rms(steady, 10 * 48000));
    std::snprintf(label, sizeof label, "level: steady noise on the side of a first landing that has nearly all of the throw: %+.2f dB (2.74 with no hold)",
                  loud);
    EXPECT(std::fabs(loud - 2.74) < 0.15, label);
  }
  {
    // A held chord through every landing count: the output at the default
    // Mix is never more than 3 dB over the chord, and the wet alone never
    // more than 3.5 dB over.
    std::vector<float> pad(12 * 48000);
    const double notes[4] = {220.0, 261.63, 329.63, 441.32};
    for (size_t i = 0; i < pad.size(); ++i) {
      double v = 0.0;
      for (int n = 0; n < 4; ++n) {
        for (int h = 1; h <= 5; ++h) v += std::sin(2.0 * kPi * notes[n] * h * static_cast<double>(i) / kRate + n) / h;
      }
      pad[i] = static_cast<float>(0.04 * v);
    }
    double most = -99.0, most_mixed = -99.0;
    for (float skips : {2.0f, 5.0f, 9.0f, 16.0f}) {
      for (float bounce : {0.7f, 1.0f}) {
        for (float mix : {1.0f, 0.35f}) {
          bare(device);
          device.set_param(p::kFirst, 60.0f);
          device.set_param(p::kBounce, bounce);
          device.set_param(p::kSkips, skips);
          device.set_param(p::kMix, mix);
          Stereo out = run(device, pad);
          const double gain = db(rms(out.left, 8 * 48000) / rms(pad, 8 * 48000));
          if (mix == 1.0f) most = std::max(most, gain); else most_mixed = std::max(most_mixed, gain);
        }
      }
    }
    std::snprintf(label, sizeof label, "level: a held chord with no Loss, 2 to 16 skips: the skips alone at most %+.2f dB, at Mix 0.35 %+.2f dB",
                  most, most_mixed);
    EXPECT(most < 3.5 && most_mixed < 3.0, label);
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
    // The dry part is the input; the skips are as loud as it at most.
    EXPECT(finite(after.left) && finite(after.right) && peak(after.left) < 1.5 && peak(after.right) < 1.5, label);
    // Not stuck: it still skips, and it still comes to rest.
    Stereo tail = render(device, 3.0f, kRate);
    EXPECT(finite(tail.left) && rms(tail.left, 0, 48000) > 1.0e-3, "after bad samples the landings still sound");
    render(device, 60.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "after bad samples it still comes to rest");
    bare(device);
    Stereo clean = run(device, impulse(0.5f, kRate, kClick));
    EXPECT_NEAR(clean.left[15360], kClick * first_of(0.0f, 8), 1.0e-5, "and a click then lands as it should");
  }
  {
    // What is not sound is left out of the ring: after half a second of
    // infinities and 1e30 nothing of it is thrown. (It went in as half a
    // second at full scale, and Again kept throwing that.)
    const float inf = std::numeric_limits<float>::infinity();
    for (float poison : {inf, -inf, 1.0e30f, 3.0e38f}) {
      device.init(kRate);
      device.set_param(p::kAgain, 0.7f);
      device.set_param(p::kMix, 1.0f);
      std::vector<float> bad(24000, poison);
      bad[0] = 0.1f;  // awake
      run(device, bad);
      Stereo tail = render(device, 4.0f, kRate);
      std::snprintf(label, sizeof label, "half a second of %g leaves nothing in the ring (the tail peaks at %g)",
                    static_cast<double>(poison), std::max(peak(tail.left), peak(tail.right)));
      EXPECT(finite(tail.left) && finite(tail.right) && peak(tail.left) < 0.1 && peak(tail.right) < 0.1, label);
    }
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
      if (std::fabs(std::fabs(out.left[sample_of(seconds[k], rate)]) - kClick * first_of(0.0f, 8)) < 1.0e-4) ++landed;
    }
    std::snprintf(label, sizeof label, "at %.0f Hz the eight landings come at the same times (%d)", rate, landed);
    EXPECT(landed == 8, label);
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("skipping-stone", 10.0f, kRate, [&] { run(device, input); });
  // The most it does: sixteen landings, each read by a Drop head that splices, all in the rings, thrown again.
  device.init(kRate);
  device.set_param(p::kSkips, 16.0f);
  device.set_param(p::kBounce, 0.95f);
  device.set_param(p::kDrop, 200.0f);
  device.set_param(p::kRipple, 1.0f);
  device.set_param(p::kAgain, 0.9f);
  report_cost("skipping-stone at its most", 10.0f, kRate, [&] { run(device, input); });

  return finish("skipping-stone");
}
