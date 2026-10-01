// Native harness for Grain Delay (cpp/devices/grain-delay). After the
// conformance pass it asserts what makes it a grain delay: repeats land at
// Time, shifted by Pitch again on every pass, scattered by the sprays, at a
// level that does not move with Density.

#include "../devices/grain-delay/grain_delay.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::GrainDelay;
namespace p = livemix::grain_delay;

static GrainDelay device;

static const float kRate = 48000.0f;

// Wet only, one pass, nothing random, the tone filter out of the way: at
// Pitch 0 this is a plain delay.
static void clean(GrainDelay& d, float time_ms, float pitch) {
  d.init(kRate);
  d.set_param(p::kTime, time_ms);
  d.set_param(p::kSpray, 0.0f);
  d.set_param(p::kPitch, pitch);
  d.set_param(p::kPitchSpray, 0.0f);
  d.set_param(p::kSize, 100.0f);
  d.set_param(p::kDensity, 4.0f);
  d.set_param(p::kReverse, 0.0f);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// Noise below about 2.5 kHz at the given RMS: inside every filter's passband
// and still inside it an octave up.
static std::vector<float> soft_noise(float seconds, float level) {
  std::vector<float> out = noise(seconds, kRate, 1.0f);
  const double a = std::exp(-2.0 * kPi * 2500.0 / kRate);
  double s1 = 0.0, s2 = 0.0;
  for (float& v : out) {
    s1 = v + (s1 - v) * a;
    s2 = s1 + (s2 - s1) * a;
    v = static_cast<float>(s2);
  }
  const double scale = level / rms(out);
  for (float& v : out) v = static_cast<float>(v * scale);
  return out;
}

// A tone with 10 ms fades, then silence up to `total_seconds`.
static std::vector<float> tone_burst(float hz, float seconds, float total_seconds, float gain) {
  std::vector<float> out = sine(hz, seconds, kRate, gain);
  const size_t fade = 480;
  for (size_t i = 0; i < fade && i < out.size(); ++i) {
    const float g = static_cast<float>(i) / fade;
    out[i] *= g;
    out[out.size() - 1 - i] *= g;
  }
  out.resize(static_cast<size_t>(total_seconds * kRate), 0.0f);
  return out;
}

// The lag in [lo, hi] at which out[t] best matches in[t - lag] over
// [from, to); *match is the correlation there.
static long best_lag(const std::vector<float>& out, const std::vector<float>& in, size_t from, size_t to,
                     long lo, long hi, double* match) {
  long best = lo;
  *match = -2.0;
  for (long lag = lo; lag <= hi; ++lag) {
    double sab = 0.0, saa = 0.0, sbb = 0.0;
    for (size_t t = from; t < to; ++t) {
      const long source = static_cast<long>(t) - lag;
      if (source < 0) continue;
      sab += static_cast<double>(out[t]) * in[source];
      saa += static_cast<double>(out[t]) * out[t];
      sbb += static_cast<double>(in[source]) * in[source];
    }
    const double c = (saa > 0.0 && sbb > 0.0) ? sab / std::sqrt(saa * sbb) : 0.0;
    if (c > *match) {
      *match = c;
      best = lag;
    }
  }
  return best;
}

// Energy-weighted mean time and spread (standard deviation), in seconds.
static void arrival(const std::vector<float>& x, double* mean_seconds, double* spread_seconds) {
  double total = 0.0, first = 0.0, second = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    const double e = static_cast<double>(x[i]) * x[i];
    const double t = static_cast<double>(i) / kRate;
    total += e;
    first += e * t;
    second += e * t * t;
  }
  *mean_seconds = total > 0.0 ? first / total : 0.0;
  *spread_seconds =
      total > 0.0 ? std::sqrt(std::max(0.0, second / total - *mean_seconds * *mean_seconds)) : 0.0;
}

// Plucks every 370 ms: a 1.2 kHz tone that starts at its crest and decays
// over 8 ms, so the largest sample of each is its first.
static std::vector<float> plucks(float seconds) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate));
  const size_t period = static_cast<size_t>(0.37f * kRate);
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i % period) / kRate;
    out[i] = static_cast<float>(0.5 * std::cos(2.0 * kPi * 1200.0 * t) * std::exp(-t / 0.008));
  }
  return out;
}

// For each loud peak: energy in the 12 ms before it over the 12 ms after it,
// as a geometric mean. Far below 1 for plucks, far above for reversed ones.
static double rise_over_fall(const std::vector<float>& x) {
  const size_t window = 576;
  const double loud = 0.5 * peak(x);
  double log_sum = 0.0;
  int count = 0;
  size_t i = window;
  while (i + window < x.size()) {
    if (std::fabs(x[i]) < loud) {
      ++i;
      continue;
    }
    // The largest sample of this event.
    size_t top = i;
    for (size_t j = i; j < i + 2 * window && j + window < x.size(); ++j) {
      if (std::fabs(x[j]) > std::fabs(x[top])) top = j;
    }
    const double before = rms(x, top - window, top - 24);
    const double after = rms(x, top + 24, top + window);
    log_sum += std::log(std::max(before, 1.0e-9) / std::max(after, 1.0e-9));
    ++count;
    i = top + 4 * window;
  }
  return count > 0 ? std::exp(log_sum / count) : 1.0;
}

int main() {
  Conformance spec;
  spec.name = "grain-delay";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // How long the default patch really rings (keeps tail_seconds honest).
  {
    device.init(kRate);
    rng_state() = 0x1234567u;
    run(device, noise(1.0f, kRate, 0.5f));
    Stereo tail = render(device, 30.0f, kRate);
    size_t last = 0;
    for (size_t i = 0; i < tail.size(); ++i) {
      if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
    }
    const double seconds = static_cast<double>(last) / kRate;
    std::printf("grain-delay: default patch silent %.2f s after the input stops\n", seconds);
    EXPECT(seconds > 2.0 && seconds < 6.0, "the default tail ends within tail_seconds, not instantly");
  }

  // Pitch 0 and no sprays: a plain delay, exactly Time late, at unity.
  for (float time_ms : {120.0f, 350.0f}) {
    clean(device, time_ms, 0.0f);
    rng_state() = 0xABCDEu;
    std::vector<float> input = soft_noise(2.0f, 0.15f);
    Stereo out = run(device, input);
    const long expected = static_cast<long>(time_ms * 0.001f * kRate);
    double match = 0.0;
    const long lag = best_lag(out.left, input, 48000, 90000, expected - 40, expected + 40, &match);
    // The record and tone filters add a sample of delay.
    EXPECT(std::labs(lag - expected) <= 2, "with no spray the repeat lands at Time");
    EXPECT(match > 0.97, "at Pitch 0 the repeat is the input");
    EXPECT(std::fabs(db(rms(out.left, 48000, 90000) / rms(input, 48000 - expected, 90000 - expected))) <
               0.3,
           "a plain repeat is at unity");
    EXPECT(peak(out.left, 0, expected - 10) < 1.0e-6, "nothing comes out before Time");
  }

  // Pitch shifts the repeat, and feedback shifts it again on every pass.
  {
    std::vector<float> input = tone_burst(220.0f, 0.3f, 2.0f, 0.5f);
    clean(device, 600.0f, 12.0f);
    device.set_param(p::kFeedback, 0.7f);
    Stereo up = run(device, input);
    const double first = dominant_frequency(up.left, kRate, 100.0, 4000.0, 31200, 40800);
    const double second = dominant_frequency(up.left, kRate, 100.0, 4000.0, 60000, 69600);
    EXPECT_NEAR(first, 440.0, 440.0 * 0.02, "Pitch +12: a 220 Hz tone repeats at 440 Hz");
    EXPECT_NEAR(second, 880.0, 880.0 * 0.02, "with feedback the next repeat is at 880 Hz");
    EXPECT(tone_level(up.left, 220.0, kRate, 31200, 40800) <
               0.1 * tone_level(up.left, first, kRate, 31200, 40800),
           "the repeat holds none of the original pitch");
    EXPECT(rms(up.left, 60000, 69600) > 0.25 * rms(up.left, 31200, 40800), "the second repeat is there");

    clean(device, 600.0f, -12.0f);
    Stereo down = run(device, input);
    EXPECT_NEAR(dominant_frequency(down.left, kRate, 50.0, 4000.0, 31200, 40800), 110.0, 110.0 * 0.03,
                "Pitch -12: it repeats at 110 Hz");
    clean(device, 600.0f, 7.0f);
    Stereo fifth = run(device, input);
    EXPECT_NEAR(dominant_frequency(fifth.left, kRate, 100.0, 4000.0, 31200, 40800), 329.63,
                329.63 * 0.02, "Pitch +7: it repeats a fifth up");
  }

  // Spray smears the arrival: a 5 ms burst comes back spread over the spray.
  {
    std::vector<float> input = soft_noise(0.005f, 0.3f);
    input.resize(static_cast<size_t>(1.5f * kRate), 0.0f);
    clean(device, 200.0f, 0.0f);
    device.set_param(p::kSize, 30.0f);
    Stereo tight = run(device, input);
    clean(device, 200.0f, 0.0f);
    device.set_param(p::kSize, 30.0f);
    device.set_param(p::kSpray, 0.6f);  // up to 360 ms later
    Stereo smeared = run(device, input);
    double tight_mean, tight_spread, smeared_mean, smeared_spread;
    arrival(tight.left, &tight_mean, &tight_spread);
    arrival(smeared.left, &smeared_mean, &smeared_spread);
    EXPECT_NEAR(tight_mean, 0.2025, 0.002, "without spray the burst arrives at Time");
    EXPECT(tight_spread < 0.003, "and stays as short as it was");
    EXPECT(smeared_spread > 0.05 && smeared_spread < 0.15, "Spray spreads the arrival over its range");
    EXPECT(smeared_mean > 0.3 && smeared_mean < 0.5, "Spray only ever adds delay");
    EXPECT(peak(smeared.left, 0, 9500) < 1.0e-6, "nothing arrives before Time");
  }

  // Pitch Spray detunes grains: a tone comes back as a band around it.
  {
    clean(device, 200.0f, 0.0f);
    Stereo pure = run(device, sine(1000.0f, 4.0f, kRate, 0.5f));
    clean(device, 200.0f, 0.0f);
    device.set_param(p::kPitchSpray, 0.5f);  // up to 3 semitones either way
    Stereo detuned = run(device, sine(1000.0f, 4.0f, kRate, 0.5f));
    const double on_pitch = tone_level(pure.left, 1000.0, kRate, 48000);
    const double scattered = tone_level(detuned.left, 1000.0, kRate, 48000);
    EXPECT_NEAR(on_pitch, 0.5, 0.02, "without Pitch Spray a tone comes back as that tone");
    EXPECT(scattered < 0.3 * on_pitch, "Pitch Spray moves the grains off the pitch");
    EXPECT(std::fabs(db(rms(detuned.left, 48000) / rms(pure.left, 48000))) < 2.0,
           "without changing the level");
  }

  // Spread pans each grain at random: a mono source comes back wide.
  {
    rng_state() = 0x99u;
    std::vector<float> input = soft_noise(5.0f, 0.15f);
    clean(device, 200.0f, 7.0f);
    Stereo narrow = run(device, input);
    clean(device, 200.0f, 7.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo wide = run(device, input);
    EXPECT(correlation(narrow.left, narrow.right, 24000) > 0.999, "Spread 0: a mono source stays mono");
    const double across = correlation(wide.left, wide.right, 24000);
    EXPECT(across < 0.8 && across > 0.3, "Spread 1 decorrelates the channels");
    const double narrow_power = 2.0 * rms(narrow.left, 24000) * rms(narrow.left, 24000);
    const double wide_power =
        rms(wide.left, 24000) * rms(wide.left, 24000) + rms(wide.right, 24000) * rms(wide.right, 24000);
    EXPECT(std::fabs(db(wide_power / narrow_power)) < 1.5, "Spread keeps the loudness");
  }

  // Reverse plays grains backwards: plucks come back as swells that cut off.
  {
    std::vector<float> input = plucks(4.0f);
    EXPECT(rise_over_fall(input) < 0.1, "the test plucks fall");
    clean(device, 300.0f, 0.0f);
    device.set_param(p::kDensity, 1.0f);
    Stereo forwards = run(device, input);
    clean(device, 300.0f, 0.0f);
    device.set_param(p::kDensity, 1.0f);
    device.set_param(p::kReverse, 1.0f);
    Stereo backwards = run(device, input);
    EXPECT(rise_over_fall(forwards.left) < 0.2, "Reverse 0: plucks come back as plucks");
    EXPECT(rise_over_fall(backwards.left) > 5.0, "Reverse 1: every grain plays backwards");
    EXPECT(std::fabs(db(rms(backwards.left, 48000) / rms(forwards.left, 48000))) < 3.0,
           "at the same level");
  }

  // The level holds as Density changes, whether the grains add in power
  // (shifted) or in amplitude (a plain delay), and in between.
  {
    rng_state() = 0x5151u;
    std::vector<float> input = soft_noise(8.0f, 0.15f);
    const double reference = rms(input, 48000);
    double lowest = 1.0e9, highest = 0.0;
    for (float density : {1.0f, 2.0f, 3.0f, 5.0f, 8.0f}) {
      clean(device, 200.0f, 7.0f);
      device.set_param(p::kSize, 60.0f);
      device.set_param(p::kDensity, density);
      Stereo out = run(device, input);
      const double level = rms(out.left, 48000);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    std::printf("grain-delay: shifted, Density 1..8: %.2f to %.2f dB re input\n", db(lowest / reference),
                db(highest / reference));
    EXPECT(db(highest / lowest) < 2.0, "shifted grains: RMS within 2 dB from Density 1 to 8");
    EXPECT(db(lowest / reference) > -2.0 && db(highest / reference) < 2.0, "and at the input's level");

    lowest = 1.0e9, highest = 0.0;
    for (float density : {1.0f, 1.4f, 2.0f, 3.0f, 4.5f, 8.0f}) {
      clean(device, 200.0f, 0.0f);
      device.set_param(p::kSize, 60.0f);
      device.set_param(p::kDensity, density);
      Stereo out = run(device, input);
      const double level = rms(out.left, 48000);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    std::printf("grain-delay: plain, Density 1..8: %.2f to %.2f dB re input\n", db(lowest / reference),
                db(highest / reference));
    EXPECT(db(highest / lowest) < 1.0, "plain delay: RMS within 1 dB from Density 1 to 8");
    EXPECT(db(lowest / reference) > -1.0 && db(highest / reference) < 1.0, "and at the input's level");

    // The hand-over between the two as a spray or a detune comes in.
    lowest = 1.0e9, highest = 0.0;
    for (int which = 0; which < 3; ++which) {
      for (float amount : {0.01f, 0.02f, 0.03f, 0.04f, 0.06f, 0.1f, 0.15f, 0.2f, 0.3f, 0.5f}) {
        clean(device, 200.0f, which == 2 ? amount : 0.0f);
        device.set_param(p::kSize, 60.0f);
        device.set_param(p::kDensity, 8.0f);
        if (which == 0) device.set_param(p::kSpray, amount);
        if (which == 1) device.set_param(p::kPitchSpray, amount);
        Stereo out = run(device, input);
        const double level = rms(out.left, 48000);
        lowest = std::min(lowest, level);
        highest = std::max(highest, level);
      }
    }
    std::printf("grain-delay: small sprays and detunes at Density 8: %.2f to %.2f dB re input\n",
                db(lowest / reference), db(highest / reference));
    EXPECT(db(lowest / reference) > -2.5 && db(highest / reference) < 2.5,
           "the level holds as grains go from adding in amplitude to adding in power");
  }

  // Size is the grain length: at Density 1 a steady tone comes back as one
  // bell per Size.
  {
    for (float size_ms : {40.0f, 160.0f}) {
      clean(device, 300.0f, 0.0f);
      device.set_param(p::kSize, size_ms);
      device.set_param(p::kDensity, 1.0f);
      Stereo out = run(device, sine(1000.0f, 4.0f, kRate, 0.5f));
      // Count the dips between bells over three seconds.
      int dips = 0;
      bool low = false;
      for (size_t from = 48000; from + 96 <= 192000; from += 96) {
        const double level = rms(out.left, from, from + 96);
        if (!low && level < 0.03) {
          low = true;
          ++dips;
        } else if (low && level > 0.15) {
          low = false;
        }
      }
      EXPECT_NEAR(dips, 3000.0 / size_ms, 1.5, "one grain per Size at Density 1");
    }
  }

  // Feedback: each repeat of a plain delay is the last one scaled by it.
  {
    std::vector<float> input = tone_burst(330.0f, 0.1f, 2.0f, 0.5f);
    clean(device, 300.0f, 0.0f);
    device.set_param(p::kFeedback, 0.5f);
    Stereo out = run(device, input);
    const double first = rms(out.left, 14400, 19200);
    const double second = rms(out.left, 28800, 33600);
    const double third = rms(out.left, 43200, 48000);
    EXPECT(first > 0.3, "the first repeat is at the input's level");
    EXPECT_NEAR(second / first, 0.5, 0.03, "the second repeat is the first scaled by Feedback");
    EXPECT_NEAR(third / second, 0.5, 0.03, "and the third again");
  }

  // Tone darkens the repeats.
  {
    rng_state() = 0x4242u;
    std::vector<float> input = noise(2.0f, kRate, 0.25f);
    clean(device, 100.0f, 0.0f);
    Stereo bright = run(device, input);
    clean(device, 100.0f, 0.0f);
    device.set_param(p::kTone, 1000.0f);
    Stereo dark = run(device, input);
    EXPECT(energy_above(dark.left, 4000.0, kRate, 24000) <
               0.1 * energy_above(bright.left, 4000.0, kRate, 24000),
           "Tone removes treble from the repeats");
  }

  // Full feedback with every repeat going up: bounded, at any Density.
  for (float pitch : {12.0f, 24.0f, 0.0f}) {
    clean(device, 80.0f, pitch);
    device.set_param(p::kFeedback, 1.0f);
    device.set_param(p::kDensity, 8.0f);
    device.set_param(p::kSize, 40.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo out = run(device, sine(200.0f, 15.0f, kRate, 1.0f));
    Stereo after = render(device, 5.0f, kRate);
    EXPECT(finite(out.left) && finite(after.left), "full feedback stays finite");
    EXPECT(std::max(peak(out.left), peak(out.right)) < 3.0 &&
               std::max(peak(after.left), peak(after.right)) < 3.0,
           "full feedback with Pitch up stays bounded");
  }

  // Moving Pitch, Time and Size while sounding does not click: the steps
  // stay those of the tones being played.
  {
    clean(device, 350.0f, 0.0f);
    run(device, sine(220.0f, 1.0f, kRate, 0.5f));
    device.set_param(p::kPitch, 12.0f);
    device.set_param(p::kTime, 90.0f);
    device.set_param(p::kSize, 200.0f);
    Stereo out = run(device, sine(220.0f, 2.0f, kRate, 0.5f));
    // A 440 Hz tone at the wet limiter's ceiling of 2 would step 0.115.
    const double tone_step = 0.5 * 2.0 * kPi * 440.0 / kRate;
    std::printf(
        "grain-delay: largest step over a Pitch/Time/Size change %.4f (a 440 Hz tone at 0.5: %.4f)\n",
        max_step(out.left), tone_step);
    EXPECT(max_step(out.left) < 2.5 * tone_step, "grain parameters change without a click");
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 100.0, 2000.0, 48000, 96000), 440.0, 9.0,
                "and the new Pitch takes hold");
  }

  // Mix 0 is the dry signal untouched.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 0; i < tone.size(); ++i)
      worst = std::max(worst, std::fabs(out.left[i] - (double)tone[i]));
    EXPECT(worst < 1.0e-6, "Mix 0 passes the input through");
  }

  // The device sleeps after the tail, and what it held is not replayed.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 6.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSpray, 0.0f);
    Stereo woken = run(device, tone_burst(330.0f, 0.2f, 1.0f, 0.5f));
    // At the default octave up a grain reaches half its length ahead of Time.
    EXPECT(peak(woken.left, 0, 13800) < 1.0e-6, "nothing from before the sleep is replayed");
    EXPECT(rms(woken.left, 16800, 26400) > 0.05, "wakes on new input");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("grain-delay", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kDensity, 8.0f);
  device.set_param(p::kPitchSpray, 1.0f);
  report_cost("grain-delay at Density 8", 10.0f, kRate, [&] { run(device, input); });

  return finish("grain-delay");
}
