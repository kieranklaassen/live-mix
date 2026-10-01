// Native harness for Frequency Shifter (cpp/devices/freq-shifter). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest asserts what makes it a
// single-sideband shifter.

#include "../devices/freq-shifter/freq_shifter.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::FreqShifter;
namespace p = livemix::freq_shifter;

static FreqShifter device;

static const float kRate = 48000.0f;

// The shifter alone: no feedback, no LFO, no width, wet only.
static void clean(FreqShifter& d) {
  d.init(kRate);
  d.set_param(p::kShift, 0.0f);
  d.set_param(p::kFine, 0.0f);
  d.set_param(p::kMode, 0.0f);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kLfoDepth, 0.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// Frequency from the zero crossings in [from, to), interpolated at both ends.
static double crossing_frequency(const std::vector<float>& x, size_t from, size_t to) {
  double first = -1.0, last = -1.0;
  int count = 0;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double at = static_cast<double>(i - 1) + x[i - 1] / (static_cast<double>(x[i - 1]) - x[i]);
      if (first < 0.0) first = at;
      last = at;
      ++count;
    }
  }
  return count > 1 ? (count - 1) * kRate / (last - first) : 0.0;
}

int main() {
  Conformance spec;
  spec.name = "freq-shifter";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 2.5f;
  spec.max_peak = 5.0f;
  check_effect(device, spec, kRate);

  const size_t from = 24000, to = 72000;

  // 440 Hz shifted by +100 Hz is 540 Hz: not a ratio, a fixed number of hertz.
  {
    clean(device);
    device.set_param(p::kShift, 100.0f);
    Stereo out = run(device, sine(440.0f, 1.5f, kRate, 0.5f));
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 200.0, 1000.0, from, to), 540.0, 0.5,
                "Up: 440 Hz + 100 Hz comes out at 540 Hz");
    EXPECT_NEAR(tone_level(out.left, 540.0, kRate, from, to), 0.5, 0.01, "Up: the shifted tone keeps its level");
    EXPECT_NEAR(tone_level(out.right, 540.0, kRate, from, to), 0.5, 0.01, "Up: both channels shift up");
  }

  // Carrier and the unwanted sideband stay 40 dB under the wanted one across
  // the range the Hilbert pair covers.
  {
    double worst_carrier = -200.0, worst_image = -200.0;
    for (float hz : {100.0f, 150.0f, 220.0f, 440.0f, 1000.0f, 2500.0f, 5000.0f, 8000.0f}) {
      // 100 Hz − 100 Hz would land on DC, so the low inputs use a smaller shift.
      const float shift = hz < 200.0f ? 40.0f : 100.0f;
      clean(device);
      device.set_param(p::kShift, shift);
      Stereo out = run(device, sine(hz, 1.5f, kRate, 0.5f));
      const double wanted = tone_level(out.left, hz + shift, kRate, from, to);
      const double carrier = db(tone_level(out.left, hz, kRate, from, to) / wanted);
      const double image = db(tone_level(out.left, hz - shift, kRate, from, to) / wanted);
      worst_carrier = std::max(worst_carrier, carrier);
      worst_image = std::max(worst_image, image);
      EXPECT(wanted > 0.49 && wanted < 0.51, "the wanted sideband has unity gain at every input frequency");
    }
    std::printf("freq-shifter: worst carrier leak %.1f dB, worst unwanted sideband %.1f dB\n", worst_carrier,
                worst_image);
    EXPECT(worst_carrier < -40.0, "carrier is at least 40 dB down from 100 Hz to 8 kHz");
    EXPECT(worst_image < -40.0, "unwanted sideband is at least 40 dB down from 100 Hz to 8 kHz");
  }

  // Down takes the lower sideband.
  {
    clean(device);
    device.set_param(p::kShift, 100.0f);
    device.set_param(p::kMode, 1.0f);
    Stereo out = run(device, sine(440.0f, 1.5f, kRate, 0.5f));
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 200.0, 1000.0, from, to), 340.0, 0.5,
                "Down: 440 Hz − 100 Hz comes out at 340 Hz");
    EXPECT(db(tone_level(out.left, 540.0, kRate, from, to) / tone_level(out.left, 340.0, kRate, from, to)) < -40.0,
           "Down: the upper sideband is suppressed");
  }

  // Stereo sends the upper sideband left and the lower one right.
  {
    clean(device);
    device.set_param(p::kShift, 100.0f);
    device.set_param(p::kMode, 2.0f);
    Stereo out = run(device, sine(440.0f, 1.5f, kRate, 0.5f));
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 200.0, 1000.0, from, to), 540.0, 0.5, "Stereo: left is 540 Hz");
    EXPECT_NEAR(dominant_frequency(out.right, kRate, 200.0, 1000.0, from, to), 340.0, 0.5,
                "Stereo: right is 340 Hz");
    EXPECT(tone_level(out.left, 340.0, kRate, from, to) < 0.005 && tone_level(out.right, 540.0, kRate, from, to) < 0.005,
           "Stereo: neither side carries the other's sideband");
  }

  // Ring keeps both sidebands at equal level and still has no carrier.
  {
    clean(device);
    device.set_param(p::kShift, 100.0f);
    device.set_param(p::kMode, 3.0f);
    Stereo out = run(device, sine(440.0f, 1.5f, kRate, 0.5f));
    const double upper = tone_level(out.left, 540.0, kRate, from, to);
    const double lower = tone_level(out.left, 340.0, kRate, from, to);
    EXPECT_NEAR(upper, 0.5 * 0.7071, 0.01, "Ring: upper sideband at -3 dB");
    EXPECT_NEAR(lower, 0.5 * 0.7071, 0.01, "Ring: lower sideband at -3 dB");
    EXPECT(tone_level(out.left, 440.0, kRate, from, to) < 0.005, "Ring: no carrier");
    EXPECT_NEAR(rms(out.left, from, to), 0.5 * 0.7071, 0.01, "Ring: the same power as a single sideband");
  }

  // Fine +1 Hz against the dry signal beats once a second.
  {
    clean(device);
    device.set_param(p::kFine, 1.0f);
    device.set_param(p::kMix, 0.5f);
    Stereo out = run(device, sine(440.0f, 9.0f, kRate, 0.5f));
    // Power in 20 ms windows from 1 s to 9 s.
    std::vector<float> power;
    const size_t window = 960;
    for (size_t at = 48000; at + window <= out.size(); at += window) {
      const double level = rms(out.left, at, at + window);
      power.push_back(static_cast<float>(level * level));
    }
    const double average = mean(power);
    for (float& v : power) v -= static_cast<float>(average);
    const double beat = dominant_frequency(power, 50.0, 0.2, 10.0);
    const double depth = tone_level(power, beat, 50.0) / average;
    EXPECT_NEAR(beat, 1.0, 0.03, "Fine +1 Hz beats against the dry signal at 1 Hz");
    EXPECT(depth > 0.9, "the beat is a full cancellation, as two equal tones 1 Hz apart give");
  }

  // Feedback shifts again on every pass: 640 and 740 Hz at falling levels.
  {
    clean(device);
    device.set_param(p::kShift, 100.0f);
    device.set_param(p::kFeedback, 0.5f);
    device.set_param(p::kDelay, 10.0f);
    Stereo out = run(device, sine(440.0f, 1.5f, kRate, 0.25f));
    const double first = tone_level(out.left, 540.0, kRate, from, to);
    const double second = tone_level(out.left, 640.0, kRate, from, to);
    const double third = tone_level(out.left, 740.0, kRate, from, to);
    EXPECT_NEAR(first, 0.25, 0.01, "feedback: the first pass is the plain shift");
    EXPECT_NEAR(second / first, 0.5, 0.03, "feedback: the second pass (640 Hz) is Feedback times the first");
    EXPECT_NEAR(third / second, 0.5, 0.03, "feedback: the third pass (740 Hz) is Feedback times the second");
    device.set_param(p::kFeedback, 0.0f);
    render(device, 1.0f, kRate);
    Stereo plain = run(device, sine(440.0f, 1.5f, kRate, 0.25f));
    EXPECT(tone_level(plain.left, 640.0, kRate, from, to) < 0.001, "without feedback there is no 640 Hz");
  }

  // Tone darkens the feedback path only.
  {
    double level[2];
    for (int dark = 0; dark < 2; ++dark) {
      clean(device);
      device.set_param(p::kShift, 500.0f);
      device.set_param(p::kFeedback, 0.5f);
      device.set_param(p::kDelay, 10.0f);
      device.set_param(p::kTone, dark ? 200.0f : 16000.0f);
      Stereo out = run(device, sine(1000.0f, 1.5f, kRate, 0.25f));
      level[dark] = tone_level(out.left, 2000.0, kRate, from, to);
      EXPECT_NEAR(tone_level(out.left, 1500.0, kRate, from, to), 0.25, 0.01, "Tone leaves the first pass alone");
    }
    EXPECT(level[1] < level[0] * 0.1, "a low Tone removes the later passes");
  }

  // The LFO moves the shift by ±50 Hz at full depth, at its rate.
  {
    clean(device);
    device.set_param(p::kShift, 100.0f);
    device.set_param(p::kLfoRate, 2.0f);
    device.set_param(p::kLfoDepth, 1.0f);
    Stereo out = run(device, sine(440.0f, 5.0f, kRate, 0.5f));
    std::vector<float> track;
    const size_t window = 960;  // 20 ms: about ten cycles per reading
    for (size_t at = 48000; at + window <= out.size(); at += window) {
      track.push_back(static_cast<float>(crossing_frequency(out.left, at, at + window)));
    }
    const double centre = mean(track);
    double lowest = 1.0e9, highest = 0.0;
    for (float& v : track) {
      lowest = std::min(lowest, static_cast<double>(v));
      highest = std::max(highest, static_cast<double>(v));
      v -= static_cast<float>(centre);
    }
    EXPECT_NEAR(centre, 540.0, 2.0, "LFO: the shift swings around its setting");
    EXPECT_NEAR(lowest, 490.0, 5.0, "LFO: full depth reaches −50 Hz");
    EXPECT_NEAR(highest, 590.0, 5.0, "LFO: full depth reaches +50 Hz");
    EXPECT_NEAR(dominant_frequency(track, 50.0, 0.3, 10.0), 2.0, 0.05, "LFO: the shift moves at LFO Rate");
  }

  // The slowest LFO really is that slow: a quarter cycle of 0.01 Hz takes 25 s.
  {
    clean(device);
    device.set_param(p::kLfoRate, 0.01f);
    device.set_param(p::kLfoDepth, 1.0f);
    Stereo out = run(device, sine(440.0f, 26.0f, kRate, 0.5f));
    const double at_12 = crossing_frequency(out.left, 12 * 48000, 12 * 48000 + 24000);
    const double at_25 = crossing_frequency(out.left, 25 * 48000 - 12000, 25 * 48000 + 12000);
    EXPECT_NEAR(at_12, 440.0 + 50.0 * std::sin(2.0 * kPi * 0.01 * 12.25), 0.5, "0.01 Hz LFO: on time after 12 s");
    EXPECT_NEAR(at_25, 490.0, 0.5, "0.01 Hz LFO: at its peak after 25 s");
  }

  // Width puts the two outputs in quadrature.
  {
    double corr[2];
    for (int wide = 0; wide < 2; ++wide) {
      clean(device);
      device.set_param(p::kFine, 0.5f);
      device.set_param(p::kWidth, wide ? 1.0f : 0.0f);
      rng_state() = 0xFACEu;
      Stereo out = run(device, noise(2.0f, kRate, 0.3f));
      corr[wide] = correlation(out.left, out.right, 4800);
    }
    EXPECT(corr[0] > 0.999, "Width 0: both channels are the same");
    EXPECT(std::fabs(corr[1]) < 0.05, "Width 1: left and right are in quadrature (uncorrelated)");
  }

  // Sweeping Shift keeps the carrier phase continuous: no step larger than the
  // steepest slope of the highest frequency produced.
  {
    clean(device);
    Stereo out;
    std::vector<float> tone = sine(110.0f, 2.0f, kRate, 0.25f);
    const size_t chunk = 4800;
    for (size_t at = 0; at < tone.size(); at += chunk) {
      device.set_param(p::kShift, (at / chunk) % 2 ? 500.0f : -300.0f);
      std::vector<float> part(tone.begin() + at, tone.begin() + at + chunk);
      out = concat(out, run(device, part));
    }
    const double steepest = 0.25 * 2.0 * kPi * 610.0 / kRate;
    EXPECT(max_step(out.left) < steepest * 1.2, "Shift jumps glide without a click");
    device.set_param(p::kMode, 1.0f);
    Stereo flipped = run(device, sine(110.0f, 0.5f, kRate, 0.25f));
    EXPECT(max_step(flipped.left) < steepest * 1.5, "a Mode change crosses over without a click");
  }

  // Feedback at maximum, every mode, loud input: bounded, and it dies away.
  {
    for (int mode = 0; mode < 4; ++mode) {
      device.init(kRate);
      device.set_param(p::kFeedback, 0.98f);
      device.set_param(p::kMode, static_cast<float>(mode));
      // In Ring mode a carrier that fits the delay a whole number of times is
      // the worst case: the same part of the cycle is amplified every pass.
      device.set_param(p::kShift, 100.0f);
      device.set_param(p::kFine, 0.0f);
      device.set_param(p::kDelay, 10.0f);
      device.set_param(p::kLfoDepth, 0.0f);
      device.set_param(p::kTone, 16000.0f);
      device.set_param(p::kMix, 1.0f);
      rng_state() = 0xD00Du + mode;
      Stereo loud = run(device, noise(6.0f, kRate, 0.9f));
      Stereo tone = run(device, sine(220.0f, 6.0f, kRate, 1.0f));
      EXPECT(finite(loud.left) && finite(tone.left), "maximum feedback stays finite");
      EXPECT(peak(loud.left) < 5.0 && peak(loud.right) < 5.0 && peak(tone.left) < 5.0 && peak(tone.right) < 5.0,
             "maximum feedback stays bounded");
    }
  }

  // Mix 0 is the dry signal untouched.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    device.set_param(p::kShift, 300.0f);
    std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 0; i < tone.size(); ++i) worst = std::max(worst, std::fabs(out.left[i] - (double)tone[i]));
    EXPECT(worst < 1.0e-6, "Mix 0 passes the input through");
  }

  // A NaN, an infinity or an absurd sample in the input does not stay in
  // the device: the next sound is clean and the tail still ends in silence.
  {
    device.init(kRate);
    std::vector<float> bad = sine(330.0f, 0.5f, kRate, 0.5f);
    bad[1000] = std::nanf("");
    bad[2000] = 1.0e30f;
    bad[3000] = -HUGE_VALF;
    run(device, bad);
    Stereo next = run(device, sine(330.0f, 2.0f, kRate, 0.5f));
    Stereo tail = render(device, 4.0f, kRate);
    EXPECT(finite(next.left) && finite(next.right) && peak(next.left, 48000) < 2.5,
           "recovers from non-finite input samples");
    EXPECT(finite(tail.left) && peak(tail.left, tail.size() - 4800) == 0.0, "and still falls silent afterwards");
  }

  // The device sleeps: after the tail it returns exact zero, then wakes.
  {
    device.init(kRate);
    run(device, noise(0.5f, kRate, 0.5f));
    render(device, 4.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, sine(330.0f, 0.5f, kRate, 0.5f));
    EXPECT(rms(woken.left) > 0.1, "wakes on new input");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("freq-shifter", 10.0f, kRate, [&] { run(device, input); });

  return finish("freq-shifter");
}
