// Native harness for Reverse Delay (cpp/devices/reverse-delay). After the
// conformance pass it asserts what makes it a reverse delay: chunks come back
// mirrored in time, on the chunk grid, without clicks or gaps.

#include "../devices/reverse-delay/reverse_delay.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::ReverseDelay;
namespace p = livemix::reverse_delay;

static ReverseDelay device;

static const float kRate = 48000.0f;

// Wet only, no filtering to speak of, no spread, shortest splice.
static void clean(ReverseDelay& d, float time_ms) {
  d.init(kRate);
  d.set_param(p::kTime, time_ms);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kSmooth, 0.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// The mirror point m near `guess` for which out[t] best matches in[m - t]
// over [from, to); *match is the correlation there.
static long mirror_point(const std::vector<float>& out, const std::vector<float>& in, size_t from,
                         size_t to, long guess, double* match) {
  long best = guess;
  *match = -2.0;
  for (long m = guess - 24; m <= guess + 24; ++m) {
    double sab = 0.0, saa = 0.0, sbb = 0.0;
    for (size_t t = from; t < to; ++t) {
      const long source = m - static_cast<long>(t);
      if (source < 0 || source >= static_cast<long>(in.size())) continue;
      sab += static_cast<double>(out[t]) * in[source];
      saa += static_cast<double>(out[t]) * out[t];
      sbb += static_cast<double>(in[source]) * in[source];
    }
    const double c = (saa > 0.0 && sbb > 0.0) ? sab / std::sqrt(saa * sbb) : 0.0;
    if (c > *match) {
      *match = c;
      best = m;
    }
  }
  return best;
}

// Where the energy of [from, to) sits, 0 at the start and 1 at the end.
static double centroid(const std::vector<float>& x, size_t from, size_t to) {
  double weighted = 0.0, total = 0.0;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    const double e = static_cast<double>(x[i]) * x[i];
    weighted += e * static_cast<double>(i - from);
    total += e;
  }
  return total > 0.0 ? weighted / (total * static_cast<double>(to - from)) : 0.5;
}

// Noise below about 2.5 kHz at the given RMS: inside the passband of the
// Tone filter, so the wet signal can be compared with the input sample by
// sample.
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

// A pluck: noise with an instant attack on the first sample and an
// exponential decay. (The device wakes on the first sample that is not zero
// and starts its chunk grid there, so test signals start at sample 0.)
static std::vector<float> pluck(size_t length, float decay_seconds) {
  std::vector<float> out = soft_noise(static_cast<float>(length) / kRate, 0.2f);
  out.resize(length, 0.0f);
  for (size_t i = 0; i < length; ++i) {
    out[i] *= std::exp(-static_cast<float>(i) / (decay_seconds * kRate));
  }
  return out;
}

int main() {
  Conformance spec;
  spec.name = "reverse-delay";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 22.0f;
  spec.max_peak = 2.5f;
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
    std::printf("reverse-delay: default patch silent %.2f s after the input stops\n", seconds);
    EXPECT(seconds > 4.0 && seconds < 22.0, "the default tail ends within tail_seconds, not instantly");
  }

  // Chunk k plays the chunk before it mirrored about the chunk boundary, and
  // the boundaries are Time apart.
  for (float time_ms : {250.0f, 100.0f}) {
    clean(device, time_ms);
    const long chunk = static_cast<long>(time_ms * 0.001f * kRate);
    rng_state() = 0xABCDEu;
    std::vector<float> input = soft_noise(1.0f, 0.15f);
    Stereo out = run(device, input);
    double match1 = 0.0, match2 = 0.0;
    const long m1 =
        mirror_point(out.left, input, chunk + chunk / 4, 2 * chunk - chunk / 4, 2 * chunk, &match1);
    const long m2 =
        mirror_point(out.left, input, 2 * chunk + chunk / 4, 3 * chunk - chunk / 4, 4 * chunk, &match2);
    EXPECT(match1 > 0.95 && match2 > 0.95, "a chunk is the previous chunk played backwards");
    EXPECT(std::labs(m1 - 2 * chunk) <= 4, "the first chunk mirrors about its start at Time");
    EXPECT(m2 - m1 == 2 * chunk, "chunks start exactly Time apart");
    // A wire or a forward delay would not correlate with the mirrored input.
    EXPECT(std::fabs(correlation(out.left, input, chunk + chunk / 4, 2 * chunk - chunk / 4)) < 0.1,
           "the chunk is not the input played forwards");
  }

  // A pluck (sharp attack, slow decay) comes back as a swell that stops dead.
  {
    clean(device, 500.0f);
    const size_t chunk = 24000;
    std::vector<float> input = pluck(4 * chunk, 0.06f);
    Stereo out = run(device, input);
    const double in_centre = centroid(input, 0, chunk);
    const double out_centre = centroid(out.left, chunk, 2 * chunk);
    EXPECT(in_centre < 0.1, "the test pluck is front-loaded");
    EXPECT(out_centre > 0.9, "reversed, its energy sits at the end of the chunk");
    EXPECT_NEAR(out_centre, 1.0 - in_centre, 0.01, "the envelope is mirrored within the chunk");
    const double swell_early = rms(out.left, chunk + 16800, chunk + 19200);
    const double swell_late = rms(out.left, chunk + 21600, chunk + 23900);
    // What follows the cut is the 20 Hz low cut settling (8 ms time constant).
    const double just_after = rms(out.left, 2 * chunk + 300, 2 * chunk + 1200);
    const double after = rms(out.left, 2 * chunk + 2400, 2 * chunk + 4800);
    EXPECT(swell_late > 3.0 * swell_early, "the reversed pluck rises");
    EXPECT(just_after < 0.05 * swell_late && after < 0.002 * swell_late,
           "and ends sharply where the attack was");
  }

  // An upward sweep comes back downward.
  {
    clean(device, 500.0f);
    const size_t chunk = 24000;
    std::vector<float> input(4 * chunk, 0.0f);
    double phase = 0.0;
    for (size_t i = 0; i < chunk; ++i) {
      const double hz = 300.0 * std::pow(10.0, static_cast<double>(i) / chunk);
      phase += 2.0 * kPi * hz / kRate;
      input[i] = 0.5f * static_cast<float>(std::sin(phase));
    }
    Stereo out = run(device, input);
    const double in_start = dominant_frequency(input, kRate, 200.0, 4000.0, 1200, 3600);
    const double in_end = dominant_frequency(input, kRate, 200.0, 4000.0, chunk - 3600, chunk - 1200);
    const double out_start =
        dominant_frequency(out.left, kRate, 200.0, 4000.0, chunk + 1200, chunk + 3600);
    const double out_end =
        dominant_frequency(out.left, kRate, 200.0, 4000.0, 2 * chunk - 3600, 2 * chunk - 1200);
    EXPECT(in_end > 5.0 * in_start, "the test sweep rises");
    EXPECT_NEAR(out_start, in_end, in_end * 0.05, "the reversed sweep starts where the sweep ended");
    EXPECT_NEAR(out_end, in_start, in_start * 0.08, "and falls to where it began");
  }

  // A steady tone crosses chunk boundaries without a click, from the
  // shortest splice to a whole-chunk crossfade.
  {
    const double own_step = 0.5 * 2.0 * kPi * 220.0 / kRate;
    for (float smooth : {0.0f, p::kParamDefault[p::kSmooth], 1.0f}) {
      clean(device, 250.0f);
      device.set_param(p::kSmooth, smooth);
      Stereo out = run(device, sine(220.0f, 3.0f, kRate, 0.5f));
      const double step = max_step(out.left, 24000);
      // Two equal-power chunks in phase reach 1.41 times the tone.
      EXPECT(step < 1.6 * own_step, "no click at chunk boundaries with a steady tone");
      if (smooth == 0.0f) {
        EXPECT_NEAR(tone_level(out.left, 220.0, kRate, 27000, 33000), 0.5, 0.02,
                    "a reversed tone is that tone");
      }
    }
  }

  // No gap either: steady noise keeps its level through every crossfade.
  {
    for (float smooth : {0.0f, 0.5f, 1.0f}) {
      clean(device, 200.0f);
      device.set_param(p::kSmooth, smooth);
      rng_state() = 0x777u;
      std::vector<float> input = soft_noise(4.0f, 0.15f);
      Stereo out = run(device, input);
      const double level = rms(out.left, 48000, 192000);
      double lowest = 1.0e9, highest = 0.0;
      for (size_t from = 48000; from + 4800 <= 192000; from += 2400) {
        const double window = rms(out.left, from, from + 4800);
        lowest = std::min(lowest, window);
        highest = std::max(highest, window);
      }
      EXPECT(std::fabs(db(level / rms(input, 48000, 192000))) < 0.5,
             "the reversed signal is at the input's level");
      EXPECT(db(lowest / level) > -2.0 && db(highest / level) < 2.0,
             "equal-power crossfades leave no dip or bump at chunk boundaries");
    }
  }

  // Pitch reads at double or half speed.
  {
    const float expected[3] = {440.0f, 880.0f, 220.0f};
    for (int choice = 0; choice < 3; ++choice) {
      clean(device, 300.0f);
      device.set_param(p::kPitch, static_cast<float>(choice));
      Stereo out = run(device, sine(440.0f, 2.0f, kRate, 0.5f));
      const double hz = dominant_frequency(out.left, kRate, 100.0, 2000.0, 60000, 70000);
      EXPECT_NEAR(hz, expected[choice], expected[choice] * 0.01,
                  "Pitch: Normal, Octave up, Octave down");
    }
  }

  // Feedback layers repeats: the second pass is reversed twice, so it plays
  // forwards, one chunk later and scaled by Feedback.
  {
    const size_t chunk = 24000;
    std::vector<float> input = pluck(6 * chunk, 0.06f);
    for (size_t i = chunk; i < input.size(); ++i) input[i] = 0.0f;
    clean(device, 500.0f);
    Stereo once = run(device, input);
    clean(device, 500.0f);
    device.set_param(p::kFeedback, 0.6f);
    Stereo layered = run(device, input);
    const double first = rms(layered.left, chunk, 2 * chunk);
    const double second = rms(layered.left, 2 * chunk, 3 * chunk);
    const double third = rms(layered.left, 3 * chunk, 4 * chunk);
    EXPECT(rms(once.left, 2 * chunk + 2400, 3 * chunk) < 0.001 * first,
           "without feedback there is one repeat");
    EXPECT_NEAR(second / first, 0.6, 0.05, "the second repeat is the first scaled by Feedback");
    EXPECT_NEAR(third / second, 0.6, 0.05, "and the third again");
    EXPECT(centroid(layered.left, 2 * chunk, 3 * chunk) < 0.1, "the second repeat plays forwards");
    EXPECT(centroid(layered.left, 3 * chunk, 4 * chunk) > 0.9, "the third is reversed again");
  }

  // Tone and Low Cut shape the wet signal.
  {
    rng_state() = 0x4242u;
    std::vector<float> input = noise(2.0f, kRate, 0.25f);
    clean(device, 200.0f);
    Stereo bright = run(device, input);
    clean(device, 200.0f);
    device.set_param(p::kTone, 1000.0f);
    Stereo dark = run(device, input);
    EXPECT(energy_above(dark.left, 4000.0, kRate, 24000) <
               0.1 * energy_above(bright.left, 4000.0, kRate, 24000),
           "Tone removes treble from the repeats");
    clean(device, 200.0f);
    Stereo full = run(device, sine(60.0f, 2.0f, kRate, 0.5f));
    clean(device, 200.0f);
    device.set_param(p::kLowCut, 800.0f);
    Stereo thin = run(device, sine(60.0f, 2.0f, kRate, 0.5f));
    EXPECT(tone_level(full.left, 60.0, kRate, 48000) > 0.4, "Low Cut at 20 Hz keeps a 60 Hz tone");
    EXPECT(tone_level(thin.left, 60.0, kRate, 48000) < 0.1 * tone_level(full.left, 60.0, kRate, 48000),
           "Low Cut at 800 Hz removes it");
  }

  // Spread: chunks alternate sides; without it both sides carry every chunk.
  {
    rng_state() = 0x99u;
    std::vector<float> input = soft_noise(1.5f, 0.15f);
    const size_t chunk = 12000;
    clean(device, 250.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo wide = run(device, input);
    const double l1 = rms(wide.left, chunk + 3000, 2 * chunk - 3000),
                 r1 = rms(wide.right, chunk + 3000, 2 * chunk - 3000);
    const double l2 = rms(wide.left, 2 * chunk + 3000, 3 * chunk - 3000),
                 r2 = rms(wide.right, 2 * chunk + 3000, 3 * chunk - 3000);
    EXPECT(r1 > 30.0 * l1 && l2 > 30.0 * r2, "Spread 1: consecutive chunks land on opposite sides");
    clean(device, 250.0f);
    Stereo narrow = run(device, input);
    EXPECT(correlation(narrow.left, narrow.right, chunk, 5 * chunk) > 0.999,
           "Spread 0: a mono source stays mono");
    const double wide_power = rms(wide.left, chunk, 5 * chunk) * rms(wide.left, chunk, 5 * chunk) +
                              rms(wide.right, chunk, 5 * chunk) * rms(wide.right, chunk, 5 * chunk);
    const double narrow_power =
        2.0 * rms(narrow.left, chunk, 5 * chunk) * rms(narrow.left, chunk, 5 * chunk);
    EXPECT(std::fabs(db(wide_power / narrow_power)) < 1.0, "Spread keeps the loudness");
  }

  // Smooth sets the crossfade: at 1 the outgoing chunk is still there a
  // quarter of the way into the next one, at 0 it is gone.
  {
    rng_state() = 0x99u;
    std::vector<float> input = soft_noise(1.5f, 0.15f);
    const size_t chunk = 12000;
    double far_side[2];
    int n = 0;
    for (float smooth : {0.0f, 1.0f}) {
      clean(device, 250.0f);
      device.set_param(p::kSpread, 1.0f);
      device.set_param(p::kSmooth, smooth);
      Stereo out = run(device, input);
      // Chunk 4 plays on the left; the right holds what is left of chunk 3.
      far_side[n++] = rms(out.right, 4 * chunk + 2400, 4 * chunk + 3600) /
                      rms(out.left, 4 * chunk + 2400, 4 * chunk + 3600);
    }
    EXPECT(far_side[0] < 0.01, "Smooth 0: a short splice");
    EXPECT(far_side[1] > 1.5 && far_side[1] < 4.0, "Smooth 1: the crossfade takes the whole chunk");
  }

  // Changing Time while sounding does not click, and a shorter Time takes
  // hold without waiting out the long chunk.
  {
    const double own_step = 0.5 * 2.0 * kPi * 220.0 / kRate;
    clean(device, 3000.0f);
    device.set_param(p::kSmooth, 0.35f);
    run(device, sine(220.0f, 3.5f, kRate, 0.5f));
    device.set_param(p::kTime, 100.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo out = run(device, sine(220.0f, 1.0f, kRate, 0.5f));
    // At full Spread one side carries a chunk at 1.41 times the tone.
    EXPECT(max_step(out.left) < 1.6 * own_step && max_step(out.right) < 1.6 * own_step,
           "a Time change does not click");
    // 100 ms chunks alternate sides: within the second the lead changes
    // about nine times (it would not change at all inside a 3 s chunk).
    int flips = 0;
    bool left_led = rms(out.left, 9600, 10560) > rms(out.right, 9600, 10560);
    for (size_t from = 10560; from + 960 <= 48000; from += 960) {
      const bool leads = rms(out.left, from, from + 960) > rms(out.right, from, from + 960);
      if (leads != left_led) ++flips;
      left_led = leads;
    }
    EXPECT(flips >= 6 && flips <= 9, "a shorter Time takes hold within one new chunk");
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

  // Worst case for the loop: full feedback, whole-chunk crossfades, an
  // octave up, a steady full-scale tone. The record limiter holds the ring
  // at full scale, so two chunks in phase reach 1.41 (plus filter overshoot).
  {
    clean(device, 150.0f);
    device.set_param(p::kFeedback, 0.95f);
    device.set_param(p::kSmooth, 1.0f);
    device.set_param(p::kPitch, 1.0f);
    Stereo out = run(device, sine(200.0f, 20.0f, kRate, 1.0f));
    EXPECT(finite(out.left) && peak(out.left) < 1.8, "full feedback stays bounded");
    EXPECT(rms(out.left, 900000) > 0.2, "and keeps sounding while fed");
  }

  // The device sleeps after the tail and starts a fresh chunk when woken.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 22.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSmooth, 0.0f);
    render(device, 0.1f, kRate);
    rng_state() = 0x31337u;
    std::vector<float> input = soft_noise(1.5f, 0.15f);
    Stereo woken = run(device, input);
    const long chunk = static_cast<long>(p::kParamDefault[p::kTime] * 0.001f * kRate);
    EXPECT(peak(woken.left, 0, chunk - 100) < 1.0e-9, "nothing from before the sleep is replayed");
    EXPECT(rms(woken.left, chunk + chunk / 2, 2 * chunk) > 0.02, "wakes on new input, one chunk later");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("reverse-delay", 10.0f, kRate, [&] { run(device, input); });

  return finish("reverse-delay");
}
