// Native harness for Phaser (cpp/devices/phaser), a port of kkfonie Tatami's
// PhaserDevice. The conformance pass covers stability, silence when idle,
// block-size independence and parameter abuse; the rest measures the notches
// (how many, where, how far and how fast they move), the whole static
// response against the textbook transfer function, and the LFO shapes.
// Thresholds marked "Tatami" are the ones the original tests used
// (Tatami/Tests/Effects/PhaserTests.cpp).

#include <complex>

#include "../devices/phaser/phaser.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Phaser;
namespace p = livemix::phaser;

static Phaser device;

static const float kRate = 48000.0f;

// Tatami's makeMeasurablePhaser: four stages on one frequency, no feedback,
// both channels on one LFO phase, half wet.
static void measurable(Phaser& d, float rate_hz, float depth) {
  d.init(kRate);
  d.set_param(p::kStages, 0.0f);
  d.set_param(p::kCenterHz, 1000.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kStereo, 0.0f);
  d.set_param(p::kShape, 0.0f);
  d.set_param(p::kMix, 0.5f);
  d.set_param(p::kRate, rate_hz);
  d.set_param(p::kDepth, depth);
}

// Magnitude of an impulse response at `hz` (plain DFT over the whole of it).
static double response(const std::vector<float>& ir, double hz) {
  double re = 0.0, im = 0.0;
  for (size_t i = 0; i < ir.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
    re += ir[i] * std::cos(phase);
    im -= ir[i] * std::sin(phase);
  }
  return std::sqrt(re * re + im * im);
}

// Frequency of the lowest response in [lo, hi], to a hundredth of a percent.
static double deepest(const std::vector<float>& ir, double lo, double hi) {
  double best_hz = lo, best = 1.0e9;
  const int steps = 400;
  for (int pass = 0; pass < 3; ++pass) {
    for (int i = 0; i <= steps; ++i) {
      const double hz = lo * std::pow(hi / lo, static_cast<double>(i) / steps);
      const double level = response(ir, hz);
      if (level < best) {
        best = level;
        best_hz = hz;
      }
    }
    const double step = std::pow(hi / lo, 1.0 / steps);
    lo = best_hz / step;
    hi = best_hz * step;
  }
  return best_hz;
}

// Every notch (a local minimum under -20 dB) between 20 Hz and 20 kHz.
static std::vector<double> notches(const std::vector<float>& ir) {
  const int steps = 1500;
  std::vector<double> hz(steps + 1), level(steps + 1);
  for (int i = 0; i <= steps; ++i) {
    hz[i] = 20.0 * std::pow(1000.0, static_cast<double>(i) / steps);
    level[i] = response(ir, hz[i]);
  }
  std::vector<double> found;
  for (int i = 1; i < steps; ++i) {
    if (level[i] < level[i - 1] && level[i] <= level[i + 1] && db(level[i]) < -20.0) {
      found.push_back(deepest(ir, hz[i - 1], hz[i + 1]));
    }
  }
  return found;
}

// Where bilinear warping puts an analog frequency ratio: the frequency whose
// tan(pi f / fs) is `ratio` times that of `hz`.
static double warped(double hz, double ratio) {
  return kRate / kPi * std::atan(std::tan(kPi * hz / kRate) * ratio);
}

// The transfer function the device should have with the LFO stopped: stages
// tuned to centre * 2^(spread * position), one sample of delay in the feedback.
static double model(double hz, int stages, double centre, double spread, double feedback, double mix) {
  const std::complex<double> z1 = std::polar(1.0, -2.0 * kPi * hz / kRate);
  std::complex<double> chain(1.0, 0.0);
  for (int s = 0; s < stages; ++s) {
    const double position = static_cast<double>(s) / (stages - 1) * 2.0 - 1.0;
    const double f = std::min(std::max(centre * std::pow(2.0, position * spread), 10.0), 0.45 * kRate);
    const double t = std::tan(kPi * f / kRate);
    const double a = (t - 1.0) / (t + 1.0);
    chain *= (a + z1) / (1.0 + a * z1);
  }
  const std::complex<double> wet = chain / (1.0 - feedback * z1 * chain);
  return std::abs((1.0 - mix) + mix * wet);
}

// Phase of a steady tone in 5 ms windows: with the device fully wet this
// follows the sweep (the allpass chain turns phase, nothing else).
static std::vector<float> phase_track(const std::vector<float>& x, double hz, size_t from) {
  std::vector<float> track;
  for (size_t at = from; at + 240 <= x.size(); at += 240) {
    track.push_back(static_cast<float>(tone_phase(x, hz, kRate, at, at + 240)));
  }
  return track;
}

// Fully wet, four stages on 1 kHz, a shallow sweep: a 1 kHz tone's phase
// stays within +-45 degrees, so it never wraps.
static std::vector<float> sweep_track(Phaser& d, float rate_hz, float shape, float seconds) {
  measurable(d, rate_hz, 10.0f);
  d.set_param(p::kShape, shape);
  d.set_param(p::kMix, 1.0f);
  Stereo out = run(d, sine(1000.0f, seconds, kRate, 0.5f));
  return phase_track(out.left, 1000.0, 4800);
}


// Largest sample step from just before a parameter change (the seam between
// two consecutive renders) to `span` samples after it.
static double step_across(const Stereo& before, const Stereo& after, size_t span = 24000) {
  Stereo all = concat(before, after);
  const size_t seam = before.size();
  return max_step(all.left, seam - 2, seam + span);
}

// Number of times the 10 ms RMS of `x` falls below `low` (re-armed above `high`).
static int count_dips(const std::vector<float>& x, size_t from, size_t to, double low, double high) {
  const size_t window = 480;
  int dips = 0;
  bool armed = true;
  for (size_t at = from; at + window <= to; at += window) {
    const double level = rms(x, at, at + window);
    if (armed && level < low) {
      ++dips;
      armed = false;
    } else if (!armed && level > high) {
      armed = true;
    }
  }
  return dips;
}

int main() {
  Conformance spec;
  spec.name = "phaser";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 0.5f;
  spec.max_peak = 8.0f;
  check_effect(device, spec, kRate);

  // N stages make N / 2 notches, at centre * tan(pi (2k - 1) / (2N)).
  for (int choice = 0; choice < 5; ++choice) {
    const int stages = 4 + 2 * choice;
    measurable(device, 1.0f, 0.0f);
    device.set_param(p::kStages, static_cast<float>(choice));
    Stereo ir = run(device, impulse(4096.0f / kRate, kRate));
    std::vector<double> found = notches(ir.left);
    double worst = 0.0;
    for (size_t k = 0; k < found.size() && k < static_cast<size_t>(stages / 2); ++k) {
      const double expected = warped(1000.0, std::tan(kPi * (2.0 * k + 1.0) / (2.0 * stages)));
      worst = std::max(worst, std::fabs(found[k] / expected - 1.0));
    }
    std::printf("phaser %2d stages: %zu notches, first %.1f Hz, last %.1f Hz, worst position error %.3f %%\n",
                stages, found.size(), found.empty() ? 0.0 : found.front(),
                found.empty() ? 0.0 : found.back(), 100.0 * worst);
    EXPECT(static_cast<int>(found.size()) == stages / 2, "N stages make N / 2 notches");
    EXPECT(worst < 0.005, "notches sit at centre * tan(pi (2k - 1) / 2N)");
  }

  // Depth: the sweep spans Depth * 5 octaves. At 0.02 Hz the device waits
  // (asleep; the LFO is free-running) for the top and the bottom of the
  // cycle. Tatami: 2 octaves within 10 % at Depth 40, each end within 10 % of
  // sweep * tan(pi / 8), the notch more than 20 dB under the response at 30 Hz.
  {
    double notch[2];
    const float wait[2] = {12.5f, 37.5f};
    const double sweep[2] = {2000.0, 500.0};
    for (int k = 0; k < 2; ++k) {
      measurable(device, 0.02f, 40.0f);
      render(device, wait[k], kRate);
      Stereo ir = run(device, impulse(4096.0f / kRate, kRate));
      const double analog = sweep[k] * std::tan(kPi / 8.0);
      notch[k] = deepest(ir.left, analog / 2.5, analog * 2.0);
      const double depth = db(response(ir.left, 30.0)) - db(response(ir.left, notch[k]));
      std::printf("phaser first notch at LFO phase %.2f: %.1f Hz (analog %.1f, warped %.1f), %.0f dB deep\n",
                  k == 0 ? 0.25 : 0.75, notch[k], analog, warped(sweep[k], std::tan(kPi / 8.0)), depth);
      EXPECT(depth > 20.0, "the notch is a real notch");
      EXPECT_NEAR(notch[k], analog, 0.10 * analog, "sweep end within 10 % of the analog notch");
      EXPECT_NEAR(notch[k], warped(sweep[k], std::tan(kPi / 8.0)), 0.01 * analog,
                  "sweep end within 1 % of the warped notch");
    }
    const double octaves = std::log2(notch[0] / notch[1]);
    std::printf("phaser sweep at Depth 40: %.3f octaves (expected 2)\n", octaves);
    EXPECT_NEAR(octaves, 2.0, 0.2, "the sweep spans Depth * 5 octaves");
  }

  // The static response is the textbook one: stages staggered by Spread,
  // feedback of either sign round the chain, linear dry/wet sum.
  {
    struct Setting {
      int choice;
      float centre, spread, feedback, mix;
    };
    const Setting settings[] = {
        {1, 800.0f, 30.0f, 40.0f, 0.5f},     // the defaults
        {0, 1000.0f, 0.0f, -70.0f, 0.5f},    // negative feedback
        {4, 900.0f, 100.0f, 50.0f, 0.5f},    // twelve stages over two octaves
        {2, 2500.0f, 60.0f, 80.0f, 0.3f},
    };
    for (const Setting& s : settings) {
      device.init(kRate);
      device.set_param(p::kStages, static_cast<float>(s.choice));
      device.set_param(p::kCenterHz, s.centre);
      device.set_param(p::kSpread, s.spread);
      device.set_param(p::kFeedback, s.feedback);
      device.set_param(p::kDepth, 0.0f);
      device.set_param(p::kMix, s.mix);
      Stereo ir = run(device, impulse(16384.0f / kRate, kRate));
      double worst = 0.0;
      for (int i = 0; i <= 80; ++i) {
        const double hz = 25.0 * std::pow(800.0, i / 80.0);
        const double expected = model(hz, 4 + 2 * s.choice, s.centre, s.spread * 0.01,
                                      s.feedback * 0.01, s.mix);
        if (db(expected) < -40.0) continue;
        worst = std::max(worst, std::fabs(db(response(ir.left, hz)) - db(expected)));
      }
      std::printf("phaser %2d stages, spread %3.0f, feedback %+3.0f: within %.3f dB of the model\n",
                  4 + 2 * s.choice, s.spread, s.feedback, worst);
      EXPECT(worst < 0.1, "static response matches the transfer function");
    }
  }

  // Feedback sign. Positive feedback lifts the bands where the chain is in
  // phase (the bottom of the spectrum here) and leaves a dip at the notch;
  // negative feedback cuts those bands and turns the notch into a peak.
  {
    double low[2], at_notch[2];
    const float amounts[2] = {70.0f, -70.0f};
    const double notch_hz = warped(1000.0, std::tan(kPi / 8.0));
    for (int k = 0; k < 2; ++k) {
      measurable(device, 1.0f, 0.0f);
      device.set_param(p::kFeedback, amounts[k]);
      Stereo ir = run(device, impulse(16384.0f / kRate, kRate));
      low[k] = db(response(ir.left, 2.0));
      at_notch[k] = db(response(ir.left, notch_hz));
    }
    std::printf("phaser feedback +70 %%: %+.2f dB at 2 Hz, %+.2f dB at the notch; -70 %%: %+.2f dB, %+.2f dB\n",
                low[0], at_notch[0], low[1], at_notch[1]);
    EXPECT_NEAR(low[0], db(0.5 * (1.0 + 1.0 / 0.3)), 0.3, "positive feedback lifts the in-phase bands");
    EXPECT_NEAR(low[1], db(0.5 * (1.0 + 1.0 / 1.7)), 0.3, "negative feedback cuts them");
    EXPECT_NEAR(at_notch[0], db(0.5 * (1.0 - 1.0 / 1.7)), 1.0, "positive feedback keeps a dip at the notch");
    EXPECT_NEAR(at_notch[1], db(0.5 * (1.0 / 0.3 - 1.0)), 1.0, "negative feedback makes it a peak");
  }

  // Spread staggers the stages: with four stages over +-1 octave the first
  // notch drops well below 0.414 * centre.
  {
    measurable(device, 1.0f, 0.0f);
    Stereo tight = run(device, impulse(4096.0f / kRate, kRate));
    measurable(device, 1.0f, 0.0f);
    device.set_param(p::kSpread, 100.0f);
    Stereo wide = run(device, impulse(4096.0f / kRate, kRate));
    std::vector<double> a = notches(tight.left), b = notches(wide.left);
    EXPECT(a.size() == 2 && b.size() == 2, "four stages, two notches at any Spread");
    if (a.size() == 2 && b.size() == 2) {
      std::printf("phaser 4 stages: notches %.0f and %.0f Hz at Spread 0, %.0f and %.0f Hz at Spread 100\n",
                  a[0], a[1], b[0], b[1]);
      EXPECT(b[0] < 0.95 * a[0] && b[1] > 1.05 * a[1], "Spread moves the notches apart");
      EXPECT(db(model(b[0], 4, 1000.0, 1.0, 0.0, 0.5)) < -40.0 &&
                 db(model(b[1], 4, 1000.0, 1.0, 0.0, 0.5)) < -40.0,
             "to where stages an octave either side of the centre put them");
    }
  }

  // Rate, read from the phase of a tone through the fully wet chain.
  // Tatami: 0.5 Hz within 1 %.
  for (float rate : {0.5f, 3.0f}) {
    std::vector<float> track = sweep_track(device, rate, 0.0f, 30.0f);
    const double centre = mean(track);
    for (float& v : track) v -= static_cast<float>(centre);
    const double measured = dominant_frequency(track, 200.0, rate * 0.5, rate * 1.9);
    std::printf("phaser LFO rate: set %.2f Hz, measured %.4f Hz\n", rate, measured);
    EXPECT_NEAR(measured, rate, 0.01 * rate, "the sweep runs at Rate");
  }

  // The same track gives the sweep depth a second way: Depth 10 moves the
  // stages a quarter octave either side, which turns a 1 kHz tone through
  // four stages by a known angle.
  {
    std::vector<float> track = sweep_track(device, 1.0f, 0.0f, 6.0f);
    double lo = 1.0e9, hi = -1.0e9;
    for (float v : track) {
      lo = std::min(lo, static_cast<double>(v));
      hi = std::max(hi, static_cast<double>(v));
    }
    const double w0 = std::tan(kPi * 1000.0 / kRate);
    const double up = std::tan(kPi * 1000.0 * std::pow(2.0, 0.25) / kRate);
    const double down = std::tan(kPi * 1000.0 * std::pow(2.0, -0.25) / kRate);
    const double expected = 8.0 * (std::atan(w0 / down) - std::atan(w0 / up));
    std::printf("phaser Depth 10: a 1 kHz tone swings %.1f degrees (expected %.1f)\n",
                (hi - lo) * 180.0 / kPi, expected * 180.0 / kPi);
    EXPECT_NEAR(hi - lo, expected, 0.03 * expected, "phase swing matches Depth");

    device.init(kRate);
    device.set_param(p::kDepth, 0.0f);
    device.set_param(p::kMix, 1.0f);
    Stereo out = run(device, sine(1000.0f, 2.0f, kRate, 0.5f));
    std::vector<float> flat = phase_track(out.left, 1000.0, 4800);
    double flat_lo = 1.0e9, flat_hi = -1.0e9;
    for (float v : flat) {
      flat_lo = std::min(flat_lo, static_cast<double>(v));
      flat_hi = std::max(flat_hi, static_cast<double>(v));
    }
    EXPECT(flat_hi - flat_lo < 1.0e-4, "Depth 0 stops the sweep");
  }

  // The notches move at the LFO rate: at Depth 60 the first notch crosses a
  // 300 Hz tone twice per cycle.
  for (float rate : {0.5f, 1.0f}) {
    measurable(device, rate, 60.0f);
    Stereo out = run(device, sine(300.0f, 11.0f, kRate, 0.5f));
    const double full = 0.5 * std::sqrt(0.5);
    const int dips = count_dips(out.left, 48000, 11 * 48000, 0.1 * full, 0.3 * full);
    std::printf("phaser at %.1f Hz: notch crossed a 300 Hz tone %d times in 10 s\n", rate, dips);
    EXPECT(std::abs(dips - static_cast<int>(20.0f * rate)) <= 1, "notch crossings follow Rate");
  }

  // Shapes, on the same phase track (200 points a second, 1 Hz LFO).
  {
    std::vector<float> square = sweep_track(device, 1.0f, 4.0f, 6.0f);
    double lo = 1.0e9, hi = -1.0e9;
    for (float v : square) {
      lo = std::min(lo, static_cast<double>(v));
      hi = std::max(hi, static_cast<double>(v));
    }
    size_t at_ends = 0;
    for (float v : square) {
      if (v - lo < 0.02 * (hi - lo) || hi - v < 0.02 * (hi - lo)) ++at_ends;
    }
    EXPECT(hi - lo > 0.5, "Square moves the sweep");
    EXPECT(at_ends * 10 >= square.size() * 9, "Square holds the two ends of the sweep");

    // A rising sweep turns the phase one way, a falling sweep the other.
    std::vector<float> saw_up = sweep_track(device, 1.0f, 2.0f, 6.0f);
    std::vector<float> saw_down = sweep_track(device, 1.0f, 3.0f, 6.0f);
    size_t up_rising = 0, down_rising = 0;
    for (size_t i = 1; i < saw_up.size(); ++i) {
      if (saw_up[i] > saw_up[i - 1]) ++up_rising;
      if (saw_down[i] > saw_down[i - 1]) ++down_rising;
    }
    EXPECT(up_rising * 10 >= saw_up.size() * 9, "Saw up: the notches climb and snap back");
    EXPECT(down_rising * 10 <= saw_down.size(), "Saw down: the notches fall and snap back");

    std::vector<float> random = sweep_track(device, 1.0f, 5.0f, 9.0f);
    // The track starts 0.1 s in; a cycle is 200 points. Skip the first 5 of
    // each cycle (the lag) and the last one (the window straddles the step).
    double worst_spread = 0.0;
    std::vector<double> levels;
    for (int cycle = 1; cycle < 8; ++cycle) {
      double low = 1.0e9, high = -1.0e9;
      for (int i = cycle * 200 - 20 + 5; i < (cycle + 1) * 200 - 20 - 1; ++i) {
        low = std::min(low, static_cast<double>(random[static_cast<size_t>(i)]));
        high = std::max(high, static_cast<double>(random[static_cast<size_t>(i)]));
      }
      worst_spread = std::max(worst_spread, high - low);
      levels.push_back(0.5 * (low + high));
    }
    std::sort(levels.begin(), levels.end());
    int distinct = 1;
    for (size_t i = 1; i < levels.size(); ++i) {
      if (levels[i] - levels[i - 1] > 0.01) ++distinct;
    }
    EXPECT(worst_spread < 0.002, "Random holds one sweep position for the whole cycle");
    EXPECT(distinct >= 4, "Random picks a new position each cycle");
  }

  // Stereo: at 0 the channels are one signal; at 180 degrees the right sweep
  // mirrors the left and tones inside the sweep decorrelate.
  {
    std::vector<float> input(static_cast<size_t>(8.0f * kRate), 0.0f);
    for (float hz : {300.0f, 520.0f, 810.0f, 1290.0f, 2130.0f}) {
      std::vector<float> tone = sine(hz, 8.0f, kRate, 0.15f);
      for (size_t i = 0; i < input.size(); ++i) input[i] += tone[i];
    }
    device.init(kRate);
    device.set_param(p::kStereo, 0.0f);
    device.set_param(p::kMix, 1.0f);
    Stereo mono = run(device, input);
    device.init(kRate);
    device.set_param(p::kStereo, 180.0f);
    device.set_param(p::kMix, 1.0f);
    Stereo wide = run(device, input);
    device.init(kRate);
    device.set_param(p::kStereo, 180.0f);
    Stereo half = run(device, input);
    const double apart = correlation(wide.left, wide.right, 4800);
    std::printf("phaser channel correlation, tones inside the sweep: %.3f at 180 deg fully wet, %.3f at Mix 0.5\n",
                apart, correlation(half.left, half.right, 4800));
    EXPECT(mono.left == mono.right, "Stereo 0: both channels are the same signal");
    EXPECT(apart < 0.5, "Stereo 180 decorrelates the channels");

    std::vector<float> left = sweep_track(device, 1.0f, 0.0f, 4.0f);
    measurable(device, 1.0f, 10.0f);
    device.set_param(p::kStereo, 180.0f);
    device.set_param(p::kMix, 1.0f);
    Stereo out = run(device, sine(1000.0f, 4.0f, kRate, 0.5f));
    std::vector<float> right = phase_track(out.right, 1000.0, 4800);
    const double centre = mean(left);
    double opposed = 0.0;
    for (size_t i = 0; i < left.size() && i < right.size(); ++i) {
      opposed += (left[i] - centre) * (right[i] - centre);
    }
    EXPECT(opposed < 0.0, "Stereo 180: the right sweep mirrors the left");
  }

  // Tatami: fully wet is a unity-gain allpass (within 0.1 dB), and 12 stages
  // at 95 % feedback stay finite and under 10.
  {
    measurable(device, 0.3f, 60.0f);
    device.set_param(p::kMix, 1.0f);
    std::vector<float> tone = sine(700.0f, 2.0f, kRate, 0.5f);
    Stereo out = run(device, tone);
    const double change = db(rms(out.left, 48000, 72000) / rms(tone, 48000, 72000));
    std::printf("phaser fully wet against the input: %+.4f dB\n", change);
    EXPECT_NEAR(change, 0.0, 0.1, "fully wet is a unity-gain allpass");

    device.init(kRate);
    device.set_param(p::kStages, 4.0f);
    device.set_param(p::kFeedback, 95.0f);
    Stereo dense = run(device, sine(300.0f, 3.0f, kRate, 0.5f));
    EXPECT(finite(dense.left) && finite(dense.right) && peak(dense.left) < 10.0,
           "12 stages with maximum feedback stay bounded");

    // The loop limiter: 95 % feedback is the full 26 dB for a quiet low tone
    // and is held for a full-scale one.
    measurable(device, 1.0f, 0.0f);
    device.set_param(p::kFeedback, 95.0f);
    device.set_param(p::kMix, 1.0f);
    Stereo quiet = run(device, sine(2.0f, 3.0f, kRate, 0.01f));
    const double lift = db(rms(quiet.left, 48000) / (0.01 * std::sqrt(0.5)));
    const double expected = db(model(2.0, 4, 1000.0, 0.0, 0.95, 1.0));
    measurable(device, 1.0f, 0.0f);
    device.set_param(p::kFeedback, 95.0f);
    device.set_param(p::kMix, 1.0f);
    Stereo loud = run(device, sine(2.0f, 3.0f, kRate, 1.0f));
    std::printf("phaser 95 %% feedback at 2 Hz: %+.2f dB for a quiet tone (linear loop: %+.2f); full scale peaks at %.2f\n",
                lift, expected, peak(loud.left));
    EXPECT(expected > 25.0, "95 % feedback resonates about 26 dB at the bottom");
    EXPECT_NEAR(lift, expected, 0.2, "the limiter is out of the way at normal levels");
    EXPECT(peak(loud.left) < 3.3, "a full-scale tone on the resonance is held");
  }

  // Mix 0 is the dry signal untouched.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    device.set_param(p::kFeedback, 95.0f);
    std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    EXPECT(out.left == tone && out.right == tone, "Mix 0 is the input, sample for sample");
  }

  // No clicks. A 220 Hz tone at 0.5 steps 0.0144 per sample on its own.
  {
    std::vector<float> tone = sine(220.0f, 2.0f, kRate, 0.5f);

    // Stages: the change crossfades to a fresh chain, and what comes out
    // afterwards is the new stage count (six notches for twelve stages).
    device.init(kRate);
    device.set_param(p::kStages, 0.0f);
    device.set_param(p::kDepth, 0.0f);
    Stereo before = run(device, tone);
    device.set_param(p::kStages, 4.0f);
    Stereo after = run(device, tone);
    // The tone comes out at a different level with twelve stages; a click
    // would be a step larger than either steady state makes.
    const double steady = std::max(max_step(before.left, 24000), max_step(after.left, 24000));
    std::printf("phaser largest sample step: %.4f steady, %.4f across a Stages change\n", steady,
                step_across(before, after));
    EXPECT(step_across(before, after) < 1.2 * steady + 0.002,
           "a Stages change crossfades without a click");
    render(device, 0.5f, kRate);
    device.set_param(p::kFeedback, 0.0f);
    device.set_param(p::kSpread, 0.0f);
    Stereo ir = run(device, impulse(4096.0f / kRate, kRate));
    EXPECT(notches(ir.left).size() == 6, "after the fade the chain has the new stage count");

    // Random steps at 3 Hz over four octaves, eight stages with feedback.
    auto stepped = [&](float shape) {
      device.init(kRate);
      device.set_param(p::kStages, 2.0f);
      device.set_param(p::kCenterHz, 1000.0f);
      device.set_param(p::kFeedback, 45.0f);
      device.set_param(p::kRate, 3.0f);
      device.set_param(p::kDepth, 80.0f);
      device.set_param(p::kShape, shape);
      device.set_param(p::kStereo, 0.0f);
      Stereo out = run(device, sine(220.0f, 4.0f, kRate, 0.5f));
      return max_step(out.left, 4800);
    };
    const double smooth = stepped(0.0f);
    const double random = stepped(5.0f);
    const double square = stepped(4.0f);
    std::printf("phaser largest sample step: Sine %.4f, Random %.4f, Square %.4f\n", smooth, random,
                square);
    EXPECT(random < 2.0 * smooth && square < 2.0 * smooth, "stepped shapes do not click");

    device.init(kRate);
    device.set_param(p::kCenterHz, 200.0f);
    device.set_param(p::kDepth, 0.0f);
    Stereo low = run(device, tone);
    device.set_param(p::kCenterHz, 4000.0f);
    Stereo moved = run(device, tone);
    std::printf("phaser largest sample step across a Centre change, 200 Hz to 4 kHz: %.4f\n",
                step_across(low, moved));
    EXPECT(step_across(low, moved) < 0.05, "a Centre change glides without a click");
  }

  // The device sleeps once the loop has rung out, and wakes on input.
  {
    device.init(kRate);
    device.set_param(p::kStages, 4.0f);
    device.set_param(p::kFeedback, 95.0f);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 2.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, impulse(0.5f, kRate));
    EXPECT(peak(woken.left) > 0.1, "wakes on new input");
  }

  // Level at defaults: positive feedback lifts the lows and highs a little
  // and the notches take some away; noise ends up near unity.
  {
    device.init(kRate);
    rng_state() = 0xBEEFu;
    std::vector<float> input = noise(4.0f, kRate, 0.25f);
    Stereo out = run(device, input);
    const double change = db(rms(out.left, 48000) / rms(input, 48000));
    std::printf("phaser default level against the input: %+.2f dB on white noise\n", change);
    EXPECT(change > -3.0 && change < 3.0, "the default patch is close to unity");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("phaser", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kStages, 4.0f);
  report_cost("phaser, 12 stages", 10.0f, kRate, [&] { run(device, input); });

  return finish("phaser");
}
