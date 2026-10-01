// Native harness for Chorus (cpp/devices/chorus), a port of kkfonie Tatami's
// ChorusDevice. The conformance pass covers stability, silence when idle,
// block-size independence and parameter abuse; the rest measures the voices
// (how far and how fast their read points move, the pitch bend that makes),
// the stereo spread, the feedback comb and the wet high-pass. Thresholds
// marked "Tatami" are the ones the original tests used
// (Tatami/Tests/Effects/ChorusTests.cpp).

#include "../devices/chorus/chorus.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Chorus;
namespace p = livemix::chorus;

static Chorus device;

static const float kRate = 48000.0f;

// Fully wet, two voices, no spread, feedback or high-pass (Tatami's
// makeMeasurableChorus): the output is the two read points and nothing else.
static void measurable(Chorus& d, float rate_hz, float depth, float delay_ms) {
  d.init(kRate);
  d.set_param(p::kVoices, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kHpHz, 20.0f);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kRate, rate_hz);
  d.set_param(p::kDepth, depth);
  d.set_param(p::kDelayMs, delay_ms);
}

// As above with Spread at 100: two voices pan hard left and right, so the
// left output is voice 0 alone.
static void one_voice(Chorus& d, float rate_hz, float depth, float delay_ms) {
  measurable(d, rate_hz, depth, delay_ms);
  d.set_param(p::kSpread, 100.0f);
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

// Delays of the peaks of |x| above `threshold` in [from, to), relative to `origin`.
static std::vector<double> peak_delays(const std::vector<float>& x, size_t from, size_t to,
                                       float threshold, size_t origin) {
  std::vector<double> delays;
  for (size_t i = from + 2; i + 2 < to && i + 1 < x.size(); ++i) {
    const float v = std::fabs(x[i]);
    if (v < threshold) continue;
    if (v >= std::fabs(x[i - 1]) && v > std::fabs(x[i + 1])) {
      delays.push_back(refine_peak(x, i) - static_cast<double>(origin));
    }
  }
  return delays;
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

static DelayTrack track_delays(Chorus& d, int period, int total, float threshold) {
  std::vector<float> train(static_cast<size_t>(total), 0.0f);
  for (int i = 0; i < total; i += period) train[static_cast<size_t>(i)] = 1.0f;
  Stereo out = run(d, train);
  DelayTrack track;
  for (int start = period; start + period <= total; start += period) {
    for (double delay : peak_delays(out.left, static_cast<size_t>(start),
                                    static_cast<size_t>(start + period), threshold,
                                    static_cast<size_t>(start))) {
      track.min = std::min(track.min, delay);
      track.max = std::max(track.max, delay);
      track.delays.push_back(static_cast<float>(delay));
    }
  }
  return track;
}

// Highest and lowest frequency of a tone over [from, to): rising zero
// crossings, each frequency taken over eight periods.
static void frequency_range(const std::vector<float>& x, size_t from, size_t to, double* lowest,
                            double* highest) {
  std::vector<double> crossings;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      crossings.push_back(static_cast<double>(i - 1) +
                          static_cast<double>(-x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]));
    }
  }
  *lowest = 1.0e9;
  *highest = 0.0;
  for (size_t i = 8; i < crossings.size(); ++i) {
    const double hz = 8.0 * kRate / (crossings[i] - crossings[i - 8]);
    *lowest = std::min(*lowest, hz);
    *highest = std::max(*highest, hz);
  }
}


// Largest sample step from just before a parameter change (the seam between
// two consecutive renders) to `span` samples after it.
static double step_across(const Stereo& before, const Stereo& after, size_t span = 24000) {
  Stereo all = concat(before, after);
  const size_t seam = before.size();
  return max_step(all.left, seam - 2, seam + span);
}

// Steady-state gain of the wet path for a quiet sine at `hz`.
static double wet_gain(Chorus& d, float hz, float amplitude = 0.1f) {
  Stereo out = run(d, sine(hz, 1.5f, kRate, amplitude));
  return rms(out.left, 48000, 72000) / (amplitude * std::sqrt(0.5));
}

int main() {
  Conformance spec;
  spec.name = "chorus";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 0.5f;
  // |in| <= 1 plus a recirculation limited to 2, times the interpolator's
  // 1.25, times three coherent voices over sqrt(3).
  spec.max_peak = 7.0f;
  check_effect(device, spec, kRate);

  // Depth: each read point swings Depth * min(5 ms, Delay - 1 ms) either side
  // of Delay. Tatami: more than 100 peaks, deviation within 10 %, centre
  // within 3 samples (measured there: 144 of 144).
  {
    measurable(device, 1.0f, 60.0f, 15.0f);
    DelayTrack track = track_delays(device, 2048, 6 * 48000, 0.25f);
    const double expected = 0.6 * 5.0 * 0.001 * kRate;  // 144 samples
    std::printf("chorus deviation %.2f samples (expected %.1f), centre %.2f, %zu peaks\n",
                track.deviation(), expected, track.centre(), track.delays.size());
    EXPECT(track.delays.size() > 100, "delay tracking sees the voices");
    EXPECT_NEAR(track.deviation(), expected, 0.10 * expected, "sweep depth is Depth * 5 ms");
    EXPECT_NEAR(track.centre(), 15.0 * 0.001 * kRate, 3.0, "sweep is centred on Delay");

    // Below 6 ms the swing is capped at Delay - 1 ms, so a read never gets
    // closer than 1 ms to the write.
    measurable(device, 1.0f, 100.0f, 5.0f);
    DelayTrack shallow = track_delays(device, 2048, 4 * 48000, 0.25f);
    EXPECT_NEAR(shallow.deviation(), 4.0 * 0.001 * kRate, 4.0, "at 5 ms the swing is 4 ms");
    EXPECT(shallow.min > 0.9 * 0.001 * kRate, "reads stay 1 ms behind the write");

    measurable(device, 1.0f, 0.0f, 15.0f);
    DelayTrack still = track_delays(device, 2048, 2 * 48000, 0.25f);
    EXPECT(still.deviation() < 0.01, "Depth 0 is a fixed delay");
  }

  // Rate: one voice's read point repeats at Rate. Tatami: 1.3 Hz within 1 %.
  for (float rate : {1.3f, 0.2f}) {
    one_voice(device, rate, 50.0f, 12.0f);
    DelayTrack track = track_delays(device, 2048, 40 * 48000, 0.25f);
    std::vector<float> sweep = track.delays;
    const double centre = mean(sweep);
    for (float& v : sweep) v -= static_cast<float>(centre);
    const double measured = dominant_frequency(sweep, kRate / 2048.0, rate * 0.5, rate * 2.0);
    std::printf("chorus LFO rate: set %.2f Hz, measured %.4f Hz\n", rate, measured);
    EXPECT_NEAR(measured, rate, 0.01 * rate, "the voices move at Rate");
  }

  // Pitch: a read point moving as d(t) = D sin(2 pi r t) bends a tone by
  // +-2 pi r D. Depth 60 % at 15 ms is D = 3 ms, so 1 Hz gives +-1.885 %
  // (+-32 cents); half the depth gives half of it.
  {
    double bend[2];
    const float depths[2] = {60.0f, 30.0f};
    for (int k = 0; k < 2; ++k) {
      one_voice(device, 1.0f, depths[k], 15.0f);
      Stereo out = run(device, sine(1000.0f, 5.0f, kRate, 0.5f));
      double lowest, highest;
      frequency_range(out.left, 48000, 5 * 48000, &lowest, &highest);
      bend[k] = 0.5 * (highest - lowest) / 1000.0;
      std::printf("chorus depth %.0f %%: a 1 kHz tone moves %.2f..%.2f Hz (+-%.1f cents)\n", depths[k],
                  lowest, highest, 1200.0 * std::log2(1.0 + bend[k]));
    }
    const double expected = 2.0 * kPi * 1.0 * 0.003;
    EXPECT_NEAR(bend[0], expected, 0.05 * expected, "pitch deviation is 2 pi * Rate * swing");
    EXPECT_NEAR(bend[1], 0.5 * expected, 0.05 * 0.5 * expected, "half the Depth, half the bend");
  }

  // Voices: an impulse comes back once per voice, at Delay + D sin(lfo + v/voices).
  // The LFO is parked at 1/8 of a cycle by waiting 12.5 s at 0.01 Hz (asleep:
  // the LFO is free-running), where no two voices of either set coincide.
  for (int voices : {2, 3}) {
    device.init(kRate);
    device.set_param(p::kVoices, static_cast<float>(voices - 2));
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kFeedback, 0.0f);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kRate, 0.01f);
    device.set_param(p::kDepth, 100.0f);
    device.set_param(p::kDelayMs, 20.0f);
    render(device, 12.5f, kRate);
    Stereo out = run(device, impulse(0.05f, kRate));
    std::vector<double> echoes = peak_delays(out.left, 0, out.left.size(), 0.2f, 0);
    EXPECT(static_cast<int>(echoes.size()) == voices, "one echo per voice");
    std::vector<double> expected;
    for (int v = 0; v < voices; ++v) {
      expected.push_back(960.0 + 240.0 * std::sin(2.0 * kPi * (0.125 + static_cast<double>(v) / voices)));
    }
    std::sort(expected.begin(), expected.end());
    double worst = 0.0;
    for (size_t i = 0; i < echoes.size() && i < expected.size(); ++i) {
      worst = std::max(worst, std::fabs(echoes[i] - expected[i]));
    }
    std::printf("chorus %d voices: %zu echoes, worst position error %.2f samples\n", voices,
                echoes.size(), worst);
    EXPECT(worst < 1.5, "voices sit evenly round the LFO cycle");
  }

  // Two and three voices are equally loud once they have drifted apart, and
  // the wet path is close to unity. Tatami: three voices with 90 % feedback
  // stay between -6 and +12 dB of the input.
  {
    rng_state() = 0xC402u;
    std::vector<float> input = noise(3.0f, kRate, 0.25f);
    double level[2];
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      device.set_param(p::kVoices, static_cast<float>(k));
      device.set_param(p::kSpread, 0.0f);
      device.set_param(p::kMix, 1.0f);
      Stereo out = run(device, input);
      level[k] = db(rms(out.left, 48000) / rms(input, 48000));
    }
    std::printf("chorus wet level against the input: %+.2f dB with 2 voices, %+.2f dB with 3\n",
                level[0], level[1]);
    EXPECT(std::fabs(level[0]) < 1.0 && std::fabs(level[1]) < 1.0, "the wet sum is unity for noise");

    device.init(kRate);
    device.set_param(p::kVoices, 1.0f);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kFeedback, 90.0f);
    Stereo out = run(device, input);
    const double change = db(rms(out.left, 48000, 96000) / rms(input, 48000, 96000));
    std::printf("chorus 3 voices, 90 %% feedback: %+.2f dB\n", change);
    EXPECT(finite(out.left) && change < 12.0 && change > -6.0, "feedback stays stable and near unity");
  }

  // Spread decorrelates the channels: at 0 both sides carry the same voices,
  // at 100 the voices are panned apart and the right LFO runs 90 degrees on.
  {
    rng_state() = 0x5EAD1u;
    std::vector<float> input = noise(4.0f, kRate, 0.3f);
    double apart[2];
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      device.set_param(p::kVoices, static_cast<float>(k));
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kSpread, 0.0f);
      Stereo mono = run(device, input);
      EXPECT(correlation(mono.left, mono.right, 4800) > 0.99999, "Spread 0: both channels alike");
      device.init(kRate);
      device.set_param(p::kVoices, static_cast<float>(k));
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kSpread, 100.0f);
      Stereo wide = run(device, input);
      apart[k] = correlation(wide.left, wide.right, 4800);
      // Panning must not change the total power.
      const double power = db(std::sqrt(0.5 * (rms(wide.left, 4800) * rms(wide.left, 4800) +
                                               rms(wide.right, 4800) * rms(wide.right, 4800))) /
                              rms(mono.left, 4800));
      EXPECT(std::fabs(power) < 0.5, "Spread keeps the wet power");
    }
    std::printf("chorus channel correlation at Spread 100: %.3f with 2 voices, %.3f with 3\n",
                apart[0], apart[1]);
    EXPECT(std::fabs(apart[0]) < 0.2 && std::fabs(apart[1]) < 0.2,
           "Spread 100 decorrelates the channels");
  }

  // Feedback sign. With Depth 0 the loop is the 5 ms delay: positive feedback
  // peaks at 200 Hz and dips at 100 Hz, negative feedback swaps them. Two
  // coherent voices make the wet path sqrt(2) on top.
  {
    double gain[2][2];
    const float amounts[2] = {70.0f, -70.0f};
    const float probes[2] = {200.0f, 100.0f};
    for (int k = 0; k < 2; ++k) {
      for (int f = 0; f < 2; ++f) {
        measurable(device, 1.0f, 0.0f, 5.0f);
        device.set_param(p::kFeedback, amounts[k]);
        gain[k][f] = wet_gain(device, probes[f]) / std::sqrt(2.0);
      }
    }
    std::printf("chorus feedback +70 %%: %.2f dB at 1/T, %.2f dB at 1/2T; -70 %%: %.2f dB, %.2f dB\n",
                db(gain[0][0]), db(gain[0][1]), db(gain[1][0]), db(gain[1][1]));
    EXPECT_NEAR(gain[0][0], 1.0 / 0.3, 0.1, "positive feedback: peak at 1 / delay");
    EXPECT_NEAR(gain[0][1], 1.0 / 1.7, 0.02, "positive feedback: dip at half of it");
    EXPECT_NEAR(gain[1][0], 1.0 / 1.7, 0.02, "negative feedback: dip at 1 / delay");
    EXPECT_NEAR(gain[1][1], 1.0 / 0.3, 0.1, "negative feedback: peak at half of it");

    // The loop limiter holds a full-scale tone on the 95 % resonance.
    measurable(device, 1.0f, 0.0f, 5.0f);
    device.set_param(p::kFeedback, 95.0f);
    Stereo loud = run(device, sine(200.0f, 2.0f, kRate, 1.0f));
    std::printf("chorus full-scale tone on the 95 %% resonance: peak %.2f\n", peak(loud.left));
    EXPECT(finite(loud.left) && peak(loud.left) < 3.3 * std::sqrt(2.0), "the resonance is held");
  }

  // High-pass works on the wet signal only: a one-pole, -3 dB at the setting,
  // and exactly out of the path at 20 Hz.
  {
    measurable(device, 1.0f, 0.0f, 10.0f);
    const double open = wet_gain(device, 50.0f) / std::sqrt(2.0);
    measurable(device, 1.0f, 0.0f, 10.0f);
    device.set_param(p::kHpHz, 500.0f);
    const double corner = wet_gain(device, 500.0f) / std::sqrt(2.0);
    measurable(device, 1.0f, 0.0f, 10.0f);
    device.set_param(p::kHpHz, 500.0f);
    const double below = wet_gain(device, 50.0f) / std::sqrt(2.0);
    std::printf("chorus high-pass 500 Hz: %.2f dB at 500 Hz, %.2f dB at 50 Hz (open: %.3f dB)\n",
                db(corner), db(below), db(open));
    EXPECT_NEAR(db(open), 0.0, 0.01, "High-pass at 20 Hz leaves the wet signal alone");
    EXPECT_NEAR(db(corner), -3.0, 0.5, "High-pass is -3 dB at its setting");
    EXPECT_NEAR(db(below), -20.0, 1.0, "High-pass falls 6 dB per octave");

    device.init(kRate);
    device.set_param(p::kHpHz, 2000.0f);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> low = sine(60.0f, 0.5f, kRate, 0.5f);
    Stereo dry = run(device, low);
    EXPECT(dry.left == low, "High-pass does not touch the dry signal");
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

  // Free-running LFO (Tatami: audio never resets its phase). After the same
  // time spent asleep or busy with a loud tone, one voice sits on the same
  // read point, the one the elapsed time predicts.
  {
    one_voice(device, 0.5f, 100.0f, 12.0f);
    render(device, 2.3f, kRate);
    Stereo idle = run(device, impulse(0.05f, kRate));
    one_voice(device, 0.5f, 100.0f, 12.0f);
    run(device, sine(200.0f, 2.2f, kRate, 0.9f));
    render(device, 0.1f, kRate);
    Stereo busy = run(device, impulse(0.05f, kRate));
    std::vector<double> a = peak_delays(idle.left, 0, idle.left.size(), 0.25f, 0);
    std::vector<double> b = peak_delays(busy.left, 0, busy.left.size(), 0.25f, 0);
    EXPECT(a.size() == 1 && b.size() == 1, "one voice, one echo");
    if (a.size() == 1 && b.size() == 1) {
      // The echo leaves the line when the LFO is at 0.5 Hz * (2.3 s + delay).
      const double predicted = 576.0 + 240.0 * std::sin(2.0 * kPi * 0.5 * (2.3 + a[0] / kRate));
      std::printf("chorus read point after 2.3 s: asleep %.2f, after audio %.2f, predicted %.2f\n", a[0],
                  b[0], predicted);
      EXPECT_NEAR(a[0], b[0], 0.01, "audio does not reset the LFO");
      EXPECT_NEAR(a[0], predicted, 0.5, "the LFO keeps time while the device sleeps");
    }
  }

  // No clicks: switching Voices crossfades the two sets, and Delay glides.
  // A 220 Hz tone at 0.5 steps 0.0144 per sample on its own.
  {
    std::vector<float> tone = sine(220.0f, 1.0f, kRate, 0.5f);
    // Where the switch lands in the tone and in the LFO cycle decides how far
    // a hard switch would jump, so try it at sixteen different moments, in
    // both directions.
    double steady = 0.0, worst = 0.0, after_level = 1.0;
    for (int k = 0; k < 16; ++k) {
      const float from = k % 2 == 0 ? 0.0f : 1.0f;
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kVoices, from);
      // One unbroken tone, split where the switch happens.
      const size_t split = 24000 + 2099 * static_cast<size_t>(k);
      std::vector<float> whole = sine(220.0f, 2.5f, kRate, 0.5f);
      Stereo before = run(device, std::vector<float>(whole.begin(), whole.begin() + split));
      device.set_param(p::kVoices, 1.0f - from);
      Stereo after = run(device, std::vector<float>(whole.begin() + split, whole.end()));
      steady = std::max(steady, std::max(max_step(before.left, 12000), max_step(after.left, 24000)));
      worst = std::max(worst, step_across(before, after));
      after_level = std::min(after_level, rms(after.left, 24000));
    }
    std::printf("chorus largest sample step: %.4f steady, %.4f across a Voices change\n", steady, worst);
    EXPECT(worst < 1.2 * steady + 0.002, "a Voices change crossfades without a click");
    EXPECT(after_level > 0.1, "the other voice set sounds after the change");

    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kDelayMs, 6.0f);
    Stereo settled = run(device, tone);
    device.set_param(p::kDelayMs, 28.0f);
    Stereo moved = run(device, tone);
    std::printf("chorus largest sample step across a Delay change, 6 to 28 ms: %.4f\n",
                step_across(settled, moved));
    EXPECT(step_across(settled, moved) < 0.06, "a Delay change glides without a click");
  }

  // The device sleeps once the loop has rung out, and wakes on input.
  {
    device.init(kRate);
    device.set_param(p::kFeedback, 95.0f);
    device.set_param(p::kDelayMs, 30.0f);
    run(device, noise(0.2f, kRate, 0.5f));
    Stereo tail = render(device, 16.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(tail.left, 0, 48000) > 0.01, "95 % feedback rings after the input stops");
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, impulse(0.5f, kRate));
    EXPECT(peak(woken.left) > 0.1, "wakes on new input");
  }

  // Level at defaults: the wet signal is decorrelated from the dry, so the
  // source's linear crossfade at 0.5 sits near -3 dB on noise; never above.
  {
    device.init(kRate);
    rng_state() = 0xBEEFu;
    std::vector<float> input = noise(4.0f, kRate, 0.25f);
    Stereo out = run(device, input);
    const double change = db(rms(out.left, 48000) / rms(input, 48000));
    std::printf("chorus default level against the input: %+.2f dB on white noise\n", change);
    EXPECT(change > -4.0 && change < 1.0, "the default patch does not get louder");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("chorus", 10.0f, kRate, [&] { run(device, input); });

  return finish("chorus");
}
