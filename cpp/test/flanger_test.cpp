// Native harness for Flanger (cpp/devices/flanger), a port of kkfonie
// Tatami's FlangerDevice. The conformance pass covers stability, silence when
// idle, block-size independence and parameter abuse; the rest measures the
// sweep (depth, rate, shape), the comb it makes and what feedback does to it.
// Thresholds marked "Tatami" are the ones the original tests used
// (Tatami/Tests/Effects/FlangerTests.cpp).

#include "../devices/flanger/flanger.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Flanger;
namespace p = livemix::flanger;

static Flanger device;

static const float kRate = 48000.0f;

// Fully wet, no feedback, both channels on one LFO phase: the output is the
// swept read point and nothing else.
static void measurable(Flanger& d, float rate_hz, float depth, float delay_ms, float shape) {
  d.init(kRate);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kStereo, 0.0f);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kRate, rate_hz);
  d.set_param(p::kDepth, depth);
  d.set_param(p::kDelayMs, delay_ms);
  d.set_param(p::kShape, shape);
}

// Sub-sample position of the local maximum of |x| around `index`.
static double refine_peak(const std::vector<float>& x, size_t index) {
  if (index == 0 || index + 1 >= x.size()) return static_cast<double>(index);
  const double a = std::fabs(x[index - 1]);
  const double c = std::fabs(x[index]);
  const double d = std::fabs(x[index + 1]);
  const double denom = a - 2.0 * c + d;
  return std::fabs(denom) < 1.0e-9 ? static_cast<double>(index)
                                   : static_cast<double>(index) + 0.5 * (a - d) / denom;
}

// The delay each impulse of a train comes back with (Tatami's trackDelays):
// an impulse every `period` samples, one measured delay per output peak.
struct DelayTrack {
  std::vector<float> delays;
  double min = 1.0e9;
  double max = -1.0e9;
  double deviation() const { return (max - min) * 0.5; }
  double centre() const { return (max + min) * 0.5; }
};

static DelayTrack track_delays(Flanger& d, int period, int total, float threshold, int channel = 0) {
  std::vector<float> train(static_cast<size_t>(total), 0.0f);
  for (int i = 0; i < total; i += period) train[static_cast<size_t>(i)] = 1.0f;
  Stereo out = run(d, train);
  const std::vector<float>& x = channel == 0 ? out.left : out.right;
  DelayTrack track;
  for (int start = period; start + period <= total; start += period) {
    for (int i = start + 2; i < start + period - 2; ++i) {
      const float v = std::fabs(x[static_cast<size_t>(i)]);
      if (v < threshold) continue;
      if (v >= std::fabs(x[static_cast<size_t>(i - 1)]) && v > std::fabs(x[static_cast<size_t>(i + 1)])) {
        const double delay = refine_peak(x, static_cast<size_t>(i)) - start;
        track.min = std::min(track.min, delay);
        track.max = std::max(track.max, delay);
        track.delays.push_back(static_cast<float>(delay));
      }
    }
  }
  return track;
}

// Magnitude of an impulse response at `hz` (plain DFT over the first n samples).
static double response(const std::vector<float>& ir, double hz, size_t n) {
  double re = 0.0, im = 0.0;
  for (size_t i = 0; i < n && i < ir.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
    re += ir[i] * std::cos(phase);
    im -= ir[i] * std::sin(phase);
  }
  return std::sqrt(re * re + im * im);
}

// Frequency of the lowest response between lo and hi.
static double deepest(const std::vector<float>& ir, double lo, double hi, size_t n) {
  double best_hz = lo, best = 1.0e9;
  for (double hz = lo; hz <= hi; hz += 1.0) {
    const double level = response(ir, hz, n);
    if (level < best) {
      best = level;
      best_hz = hz;
    }
  }
  const double centre = best_hz;
  for (double hz = centre - 1.0; hz <= centre + 1.0; hz += 0.01) {
    const double level = response(ir, hz, n);
    if (level < best) {
      best = level;
      best_hz = hz;
    }
  }
  return best_hz;
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


// Largest sample step from just before a parameter change (the seam between
// two consecutive renders) to `span` samples after it.
static double step_across(const Stereo& before, const Stereo& after, size_t span = 24000) {
  Stereo all = concat(before, after);
  const size_t seam = before.size();
  return max_step(all.left, seam - 2, seam + span);
}

// Steady-state gain of the wet path for a quiet sine at `hz`.
static double wet_gain(Flanger& d, float hz, float amplitude = 0.1f) {
  Stereo out = run(d, sine(hz, 1.5f, kRate, amplitude));
  return rms(out.left, 48000, 72000) / (amplitude * std::sqrt(0.5));
}

int main() {
  Conformance spec;
  spec.name = "flanger";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 0.5f;
  // |in| <= 1 plus a recirculation limited to 2, times the interpolator's 1.25.
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Depth: the read point swings Depth * 0.95 * Delay either side of Delay.
  // Tatami: more than 200 peaks, deviation within 10 %, centre within 3 samples.
  for (float shape : {0.0f, 1.0f}) {
    measurable(device, 1.0f, 50.0f, 5.0f, shape);
    DelayTrack track = track_delays(device, 1024, 6 * 48000, 0.3f);
    const double expected = 0.5 * 0.95 * 5.0 * 0.001 * kRate;  // 114 samples
    std::printf("flanger shape %.0f: deviation %.2f samples (expected %.1f), centre %.2f, %zu peaks\n",
                shape, track.deviation(), expected, track.centre(), track.delays.size());
    EXPECT(track.delays.size() > 200, "delay tracking sees every impulse");
    EXPECT_NEAR(track.deviation(), expected, 0.10 * expected, "sweep depth is Depth * 0.95 * Delay");
    EXPECT_NEAR(track.centre(), 5.0 * 0.001 * kRate, 3.0, "sweep is centred on Delay");
  }
  {
    measurable(device, 1.0f, 100.0f, 4.0f, 0.0f);
    DelayTrack full = track_delays(device, 1024, 4 * 48000, 0.3f);
    measurable(device, 1.0f, 0.0f, 4.0f, 0.0f);
    DelayTrack none = track_delays(device, 1024, 4 * 48000, 0.3f);
    EXPECT_NEAR(full.deviation(), 0.95 * 192.0, 6.0, "Depth 100 swings 95 % of the delay");
    EXPECT(full.min > 2.0, "the sweep never reaches zero delay");
    EXPECT(none.deviation() < 0.01, "Depth 0 is a fixed delay");
    EXPECT_NEAR(none.centre(), 192.0, 0.01, "Depth 0 sits exactly on Delay");
  }

  // Rate: the delay sweep repeats at Rate. Tatami: within 1 %.
  for (float rate : {0.7f, 4.0f}) {
    measurable(device, rate, 50.0f, 3.0f, 0.0f);
    DelayTrack track = track_delays(device, 512, 20 * 48000, 0.3f);
    std::vector<float> sweep = track.delays;
    const double centre = mean(sweep);
    for (float& v : sweep) v -= static_cast<float>(centre);
    const double measured = dominant_frequency(sweep, kRate / 512.0, rate * 0.5, rate * 2.0);
    std::printf("flanger LFO rate: set %.2f Hz, measured %.4f Hz\n", rate, measured);
    EXPECT_NEAR(measured, rate, 0.01 * rate, "the sweep runs at Rate");
  }

  // The slowest rate keeps time while the device is awake: half a cycle of
  // 0.01 Hz, 2.4 million samples, puts the sweep back on its centre. (A
  // single-precision phase is 2 to 4 float steps per sample here and drifts
  // by several percent, which would show as tens of samples.)
  {
    measurable(device, 0.01f, 50.0f, 5.0f, 0.0f);
    rng_state() = 0x51017u;
    run(device, noise(50.0f, kRate, 0.001f));
    Stereo out = run(device, impulse(0.02f, kRate));
    size_t at = 0;
    for (size_t i = 0; i < out.left.size(); ++i) {
      if (std::fabs(out.left[i]) > std::fabs(out.left[at])) at = i;
    }
    std::printf("flanger read point after half a cycle of 0.01 Hz: %.2f samples (centre 240)\n",
                refine_peak(out.left, at));
    EXPECT_NEAR(refine_peak(out.left, at), 240.0, 1.0, "0.01 Hz keeps time over 50 s");
  }

  // The comb: notches at odd multiples of 1 / (2 * delay), measured at the top
  // and the bottom of a slow sweep. The device is asleep while it waits, so
  // this also shows the LFO is free-running (stopped, both would be 500 Hz).
  {
    double notch[2];
    const float wait[2] = {5.0f, 15.0f};  // LFO phase 0.25 and 0.75 at 0.05 Hz
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      device.set_param(p::kDelayMs, 1.0f);
      device.set_param(p::kRate, 0.05f);
      device.set_param(p::kDepth, 50.0f);
      device.set_param(p::kFeedback, 0.0f);
      device.set_param(p::kStereo, 0.0f);
      device.set_param(p::kMix, 0.5f);
      render(device, wait[k], kRate);
      Stereo ir = run(device, impulse(0.02f, kRate));
      notch[k] = deepest(ir.left, 100.0, 1500.0, 512);
      const double first = response(ir.left, notch[k], 512);
      const double third = response(ir.left, 3.0 * notch[k], 512);
      const double fifth = response(ir.left, 5.0 * notch[k], 512);
      const double between = response(ir.left, 2.0 * notch[k], 512);
      std::printf("flanger notch at LFO phase %.2f: %.1f Hz, %.1f dB deep; 3x %.1f dB, 5x %.1f dB\n",
                  k == 0 ? 0.25 : 0.75, notch[k], -db(first), -db(third), -db(fifth));
      EXPECT(db(first) < -30.0 && db(third) < -30.0 && db(fifth) < -25.0,
             "notches at 1, 3 and 5 times the first");
      EXPECT_NEAR(db(between), 0.0, 0.2, "unity between the notches");
    }
    // 1 ms +- 47.5 %: 1.475 ms and 0.525 ms.
    EXPECT_NEAR(notch[0], 1000.0 / (2.0 * 1.475), 4.0, "first notch at the top of the sweep");
    EXPECT_NEAR(notch[1], 1000.0 / (2.0 * 0.525), 10.0, "first notch at the bottom of the sweep");
  }

  // The notch moves at the LFO rate: a 600 Hz tone is crossed twice per cycle.
  for (float rate : {0.5f, 1.0f}) {
    device.init(kRate);
    device.set_param(p::kDelayMs, 1.0f);
    device.set_param(p::kRate, rate);
    device.set_param(p::kDepth, 50.0f);
    device.set_param(p::kFeedback, 0.0f);
    device.set_param(p::kMix, 0.5f);
    Stereo out = run(device, sine(600.0f, 11.0f, kRate, 0.5f));
    const double full = 0.5 * std::sqrt(0.5);
    const int dips = count_dips(out.left, 48000, 11 * 48000, 0.1 * full, 0.3 * full);
    std::printf("flanger at %.1f Hz: notch crossed a 600 Hz tone %d times in 10 s\n", rate, dips);
    EXPECT(std::abs(dips - static_cast<int>(20.0f * rate)) <= 1, "notch crossings follow Rate");
  }

  // Feedback sign. The loop is the delay plus one sample (97 samples at 2 ms):
  // positive feedback peaks at 48000/97 Hz and dips at half of it, negative
  // feedback swaps them.
  {
    const float peak_hz = kRate / 97.0f;
    double gain[2][2];
    const float amounts[2] = {70.0f, -70.0f};
    for (int k = 0; k < 2; ++k) {
      measurable(device, 1.0f, 0.0f, 2.0f, 0.0f);
      device.set_param(p::kFeedback, amounts[k]);
      gain[k][0] = wet_gain(device, peak_hz);
      measurable(device, 1.0f, 0.0f, 2.0f, 0.0f);
      device.set_param(p::kFeedback, amounts[k]);
      gain[k][1] = wet_gain(device, peak_hz * 0.5f);
    }
    std::printf("flanger feedback +70 %%: %.2f dB at 1/T, %.2f dB at 1/2T; -70 %%: %.2f dB, %.2f dB\n",
                db(gain[0][0]), db(gain[0][1]), db(gain[1][0]), db(gain[1][1]));
    EXPECT_NEAR(gain[0][0], 1.0 / 0.3, 0.1, "positive feedback: peak at 1 / loop time");
    EXPECT_NEAR(gain[0][1], 1.0 / 1.7, 0.02, "positive feedback: dip at half of it");
    EXPECT_NEAR(gain[1][0], 1.0 / 1.7, 0.02, "negative feedback: dip at 1 / loop time");
    EXPECT_NEAR(gain[1][1], 1.0 / 0.3, 0.1, "negative feedback: peak at half of it");
  }

  // The loop limiter is out of the way at normal levels (95 % feedback is the
  // full 26 dB for a quiet tone) and holds a full-scale one. Tatami: a 440 Hz
  // tone at 95 % stays finite and under 10.
  {
    measurable(device, 1.0f, 0.0f, 2.0f, 0.0f);
    device.set_param(p::kFeedback, 95.0f);
    const double quiet = wet_gain(device, kRate / 97.0f, 0.01f);
    EXPECT_NEAR(db(quiet), 26.02, 0.3, "95 % feedback resonates 26 dB for a quiet tone");
    measurable(device, 1.0f, 0.0f, 2.0f, 0.0f);
    device.set_param(p::kFeedback, 95.0f);
    Stereo loud = run(device, sine(kRate / 97.0f, 2.0f, kRate, 1.0f));
    std::printf("flanger full-scale tone on the 95 %% resonance: peak %.2f\n", peak(loud.left));
    EXPECT(finite(loud.left) && peak(loud.left) < 3.3, "a full-scale tone on the resonance is held");

    device.init(kRate);
    device.set_param(p::kFeedback, 95.0f);
    device.set_param(p::kMix, 0.5f);
    Stereo out = run(device, sine(440.0f, 4.0f, kRate, 0.25f));
    EXPECT(finite(out.left) && finite(out.right) && peak(out.left) < 10.0,
           "maximum feedback stays bounded");
  }

  // Stereo: at 0 the channels are one signal; at 180 degrees they sweep in
  // opposite directions. Tatami: left and right deviation within 15 %.
  {
    rng_state() = 0xF1A46E2u;
    std::vector<float> input = noise(4.0f, kRate, 0.3f);
    measurable(device, 1.0f, 50.0f, 5.0f, 0.0f);
    Stereo mono = run(device, input);
    measurable(device, 1.0f, 50.0f, 5.0f, 0.0f);
    device.set_param(p::kStereo, 180.0f);
    Stereo wide = run(device, input);
    const double same = correlation(mono.left, mono.right, 4800);
    const double apart = correlation(wide.left, wide.right, 4800);
    std::printf("flanger channel correlation: %.3f at 0 deg, %.3f at 180 deg\n", same, apart);
    EXPECT(mono.left == mono.right, "Stereo 0: both channels are the same signal");
    EXPECT(std::fabs(apart) < 0.2, "Stereo 180 decorrelates the channels");

    measurable(device, 1.0f, 50.0f, 5.0f, 0.0f);
    device.set_param(p::kStereo, 180.0f);
    DelayTrack left = track_delays(device, 1024, 2 * 48000, 0.3f, 0);
    measurable(device, 1.0f, 50.0f, 5.0f, 0.0f);
    device.set_param(p::kStereo, 180.0f);
    DelayTrack right = track_delays(device, 1024, 2 * 48000, 0.3f, 1);
    EXPECT_NEAR(left.deviation(), right.deviation(), 0.15 * right.deviation(),
                "both channels sweep the same depth");
    // Half a cycle apart: when the left is long the right is short.
    double opposed = 0.0;
    const size_t n = std::min(left.delays.size(), right.delays.size());
    for (size_t i = 0; i < n; ++i) opposed += (left.delays[i] - 240.0) * (right.delays[i] - 240.0);
    EXPECT(opposed < 0.0, "Stereo 180: the right sweep mirrors the left");
  }

  // Shapes. Square sits on the two ends of the sweep, Saw up only rises,
  // Random holds one delay per cycle and picks a new one each time.
  {
    measurable(device, 1.0f, 50.0f, 5.0f, 4.0f);
    DelayTrack square = track_delays(device, 1024, 6 * 48000, 0.3f);
    size_t at_ends = 0;
    for (float d : square.delays) {
      if (std::fabs(d - 126.0f) < 2.0f || std::fabs(d - 354.0f) < 2.0f) ++at_ends;
    }
    EXPECT(at_ends * 10 >= square.delays.size() * 9, "Square holds the two ends of the sweep");

    measurable(device, 1.0f, 50.0f, 5.0f, 2.0f);
    DelayTrack saw = track_delays(device, 1024, 6 * 48000, 0.3f);
    size_t rising = 0;
    for (size_t i = 1; i < saw.delays.size(); ++i) {
      if (saw.delays[i] > saw.delays[i - 1]) ++rising;
    }
    EXPECT(rising * 10 >= saw.delays.size() * 9, "Saw up: the delay rises and snaps back");

    measurable(device, 1.0f, 50.0f, 5.0f, 5.0f);
    DelayTrack random = track_delays(device, 1024, 8 * 48000, 0.3f);
    // Impulses are 1024 samples apart; group them by LFO cycle (48000 samples)
    // and skip the first two of each cycle, where the lag is still moving.
    double worst_spread = 0.0;
    std::vector<double> levels;
    for (int cycle = 1; cycle < 7; ++cycle) {
      double lo = 1.0e9, hi = -1.0e9;
      for (size_t i = 0; i < random.delays.size(); ++i) {
        const int at = static_cast<int>(i + 1) * 1024;
        if (at < cycle * 48000 + 2048 || at >= (cycle + 1) * 48000 - 1024) continue;
        lo = std::min(lo, static_cast<double>(random.delays[i]));
        hi = std::max(hi, static_cast<double>(random.delays[i]));
      }
      worst_spread = std::max(worst_spread, hi - lo);
      levels.push_back(0.5 * (lo + hi));
    }
    std::sort(levels.begin(), levels.end());
    int distinct = 1;
    for (size_t i = 1; i < levels.size(); ++i) {
      if (levels[i] - levels[i - 1] > 2.0) ++distinct;
    }
    EXPECT(worst_spread < 0.5, "Random holds one delay for the whole cycle");
    EXPECT(distinct >= 4, "Random picks a new delay each cycle");
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

  // No clicks: a stepped LFO, a Delay change and a Shape change all move the
  // read point, and each glides. A 220 Hz tone at 0.5 steps 0.0144 per sample
  // on its own.
  {
    std::vector<float> tone = sine(220.0f, 3.0f, kRate, 0.5f);
    measurable(device, 4.0f, 70.0f, 5.0f, 5.0f);
    Stereo stepped = run(device, tone);
    measurable(device, 4.0f, 70.0f, 5.0f, 4.0f);
    Stereo square = run(device, tone);
    std::printf("flanger largest sample step: Random %.4f, Square %.4f\n",
                max_step(stepped.left, 4800), max_step(square.left, 4800));
    EXPECT(max_step(stepped.left, 4800) < 0.08, "Random steps glide instead of clicking");
    EXPECT(max_step(square.left, 4800) < 0.08, "Square steps glide instead of clicking");

    measurable(device, 0.25f, 50.0f, 1.0f, 0.0f);
    Stereo settled = run(device, tone);
    device.set_param(p::kDelayMs, 8.0f);
    Stereo moved = run(device, tone);
    EXPECT(step_across(settled, moved) < 0.03, "a Delay change glides without a click");

    measurable(device, 0.25f, 50.0f, 5.0f, 0.0f);
    Stereo sine_shape = run(device, sine(220.0f, 1.0f, kRate, 0.5f));  // LFO at its peak
    device.set_param(p::kShape, 3.0f);
    Stereo reshaped = run(device, tone);
    std::printf("flanger largest sample step across a Delay change %.4f, a Shape change %.4f\n",
                step_across(settled, moved), step_across(sine_shape, reshaped));
    EXPECT(step_across(sine_shape, reshaped) < 0.08, "a Shape change glides without a click");
  }

  // The device sleeps once the loop has rung out, and wakes on input.
  {
    device.init(kRate);
    device.set_param(p::kFeedback, 95.0f);
    device.set_param(p::kDelayMs, 10.0f);
    run(device, noise(0.2f, kRate, 0.5f));
    Stereo tail = render(device, 8.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(tail.left, 0, 48000) > 0.01, "95 % feedback rings after the input stops");
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, impulse(0.5f, kRate));
    EXPECT(peak(woken.left) > 0.1, "wakes on new input");
  }

  // Level at defaults. A half-and-half linear sum of a signal and its delayed
  // copy averages -3 dB over white noise (the notches are empty); what must
  // hold is that the peaks of the comb are close to unity: (1 + 1/0.7) / 2.
  {
    device.init(kRate);
    rng_state() = 0xBEEFu;
    std::vector<float> input = noise(4.0f, kRate, 0.25f);
    Stereo out = run(device, input);
    const double change = db(rms(out.left, 48000) / rms(input, 48000));
    device.init(kRate);
    device.set_param(p::kDepth, 0.0f);
    Stereo on_peak = run(device, sine(kRate / 121.0f, 1.5f, kRate, 0.25f));  // 2.5 ms + 1 sample
    const double crest = db(rms(on_peak.left, 48000) / (0.25 * std::sqrt(0.5)));
    std::printf("flanger defaults: %+.2f dB on white noise, %+.2f dB on a comb peak\n", change, crest);
    EXPECT(change > -4.0 && change < 1.0, "the default patch does not get louder on noise");
    EXPECT_NEAR(crest, 1.69, 0.2, "the default comb peaks 1.7 dB over unity");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("flanger", 10.0f, kRate, [&] { run(device, input); });

  return finish("flanger");
}
