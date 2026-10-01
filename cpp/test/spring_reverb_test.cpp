// Native harness for Spring (cpp/devices/spring-reverb). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a spring tank: echoes one round trip
// apart, each a chirp whose top arrives after its bottom and longer on every
// trip, and nothing above the transition frequency.

#include "../devices/spring-reverb/spring_reverb.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::SpringReverb;
namespace p = livemix::spring_reverb;

static SpringReverb device;

static const float kRate = 48000.0f;
// The first spring's round trip, and the other two's (spring_reverb.h).
static const double kTripMs = 41.2;

// One spring, wet only, nothing in front of it: the bare tank.
static void bare(SpringReverb& d) {
  d.init(kRate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kSprings, 0.0f);
  d.set_param(p::kDrip, 0.0f);
  d.set_param(p::kDrive, 0.0f);
  d.set_param(p::kTone, 6000.0f);
  d.set_param(p::kPredelay, 0.0f);
}

// When the band around `hz` peaks inside [from_ms, to_ms): a band-pass 300 Hz
// wide at every frequency (so its own delay is the same for every band),
// rectified and smoothed.
static double band_arrival(const std::vector<float>& x, double hz, double from_ms, double to_ms) {
  livemix::kit::Svf band;
  band.set(static_cast<float>(hz), static_cast<float>(hz / 300.0), kRate);
  livemix::kit::OnePole smooth;
  smooth.set_cutoff(400.0f, kRate);
  double best = 0.0, at = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    const float envelope = smooth.lowpass(std::fabs(band.bandpass(x[i])));
    const double ms = 1000.0 * static_cast<double>(i) / kRate;
    if (ms >= from_ms && ms < to_ms && envelope > best) {
      best = envelope;
      at = ms;
    }
  }
  return at;
}

// Fourth-order low-pass or high-pass, for looking at one end of the band.
static std::vector<float> filtered(const std::vector<float>& x, float hz, bool high) {
  livemix::kit::Svf a, b;
  a.set(hz, 0.54f, kRate);
  b.set(hz, 1.31f, kRate);
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) {
    out[i] = high ? b.highpass(a.highpass(x[i])) : b.lowpass(a.lowpass(x[i]));
  }
  return out;
}

static size_t at_ms(double ms) { return static_cast<size_t>(ms * 0.001 * kRate); }

// Power between lo and hi Hz in 32768 samples of `x` from `from`, Hann
// windowed (the filters above leak too much to show 60 dB).
static double band_power(const std::vector<float>& x, size_t from, double lo, double hi) {
  static livemix::kit::Fft<32768> fft;
  static std::vector<float> re(32768), im(32768);
  static bool ready = false;
  if (!ready) {
    fft.init();
    ready = true;
  }
  for (size_t i = 0; i < 32768; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / 32768.0);
    re[i] = from + i < x.size() ? static_cast<float>(w * x[from + i]) : 0.0f;
    im[i] = 0.0f;
  }
  fft.forward(re.data(), im.data());
  double power = 0.0;
  for (size_t k = 0; k < 16384; ++k) {
    const double hz = static_cast<double>(k) * kRate / 32768.0;
    if (hz >= lo && hz < hi) power += static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
  }
  return power;
}

int main() {
  Conformance spec;
  spec.name = "spring-reverb";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Mix 0 is the dry signal untouched.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 0; i < tone.size(); ++i) worst = std::max(worst, std::fabs(out.left[i] - (double)tone[i]));
    EXPECT(worst < 1.0e-6, "Mix 0 passes the input through");
  }

  // Dispersion: within one echo the higher the band, the later it arrives,
  // and the second trip stretches the chirp further.
  {
    bare(device);
    Stereo out = run(device, impulse(1.0f, kRate, 0.5f));
    const double bands[6] = {600.0, 1200.0, 1800.0, 2400.0, 3000.0, 3400.0};
    double first[6], second[6];
    bool rising = true, rising_again = true;
    for (int b = 0; b < 6; ++b) {
      first[b] = band_arrival(out.left, bands[b], 0.0, 60.0);
      second[b] = band_arrival(out.left, bands[b], 60.0, 104.0);
      if (b > 0 && !(first[b] > first[b - 1] + 0.2)) rising = false;
      if (b > 0 && !(second[b] > second[b - 1] + 0.4)) rising_again = false;
    }
    EXPECT(rising, "first echo: each band arrives later than the one below (a chirp)");
    EXPECT(rising_again, "second echo: still a monotonic chirp");
    const double spread = first[5] - first[0];
    const double spread_again = second[5] - second[0];
    EXPECT(spread > 5.0 && spread < 20.0, "the first chirp spans several milliseconds from 600 Hz to 3.4 kHz");
    EXPECT(spread_again > 1.6 * spread, "the chirp is longer after a second trip through the spring");

    // The echoes are one round trip apart at the bottom of the band, where
    // there is little dispersion.
    const double third = band_arrival(out.left, 600.0, 104.0, 146.0);
    EXPECT_NEAR(first[0], 0.5 * kTripMs + 4.0, 1.5, "the pickup hears the first echo half a round trip in");
    EXPECT_NEAR(second[0] - first[0], kTripMs, 0.7, "the second echo is one round trip after the first");
    EXPECT_NEAR(third - second[0], kTripMs, 0.7, "the third echo is one round trip after the second");
    // Each reflection inverts: successive echoes have opposite signs.
    std::vector<float> low = filtered(out.left, 500.0f, false);
    double sign[3];
    const double centre[3] = {first[0], second[0], third};
    for (int e = 0; e < 3; ++e) {
      size_t best = at_ms(centre[e] - 6.0);
      for (size_t i = best; i < at_ms(centre[e] + 6.0); ++i) {
        if (std::fabs(low[i]) > std::fabs(low[best])) best = i;
      }
      sign[e] = low[best];
    }
    EXPECT(sign[0] * sign[1] < 0.0 && sign[1] * sign[2] < 0.0, "each reflection inverts the echo");
  }

  // Tension shapes the chirp without moving the echoes: slack spreads the
  // middle of the band, taut keeps it tight.
  {
    double middle[2], spacing[2];
    for (int k = 0; k < 2; ++k) {
      bare(device);
      device.set_param(p::kTension, k == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, impulse(1.0f, kRate, 0.5f));
      const double low = band_arrival(out.left, 600.0, 0.0, 60.0);
      middle[k] = band_arrival(out.left, 2400.0, 0.0, 60.0) - low;
      spacing[k] = band_arrival(out.left, 600.0, 60.0, 104.0) - low;
    }
    EXPECT(middle[0] > 1.6 * middle[1] && middle[1] > 0.5, "slack Tension holds the middle of the band back further");
    EXPECT_NEAR(spacing[0], kTripMs, 0.7, "slack Tension keeps the round trip");
    EXPECT_NEAR(spacing[1], kTripMs, 0.7, "taut Tension keeps the round trip");
  }

  // RT60 follows Decay (at the bottom of the band; the top falls faster).
  {
    const float decays[2] = {1.0f, 4.0f};
    for (int k = 0; k < 2; ++k) {
      bare(device);
      device.set_param(p::kDecay, decays[k]);
      rng_state() = 0x5EEDu;
      std::vector<float> burst = noise(0.1f, kRate, 0.5f);
      burst.resize(static_cast<size_t>(kRate * (decays[k] * 1.3f + 0.5f)), 0.0f);
      Stereo out = run(device, burst);
      const double low = rt60(filtered(out.left, 1000.0f, false), kRate, 0.2, 0.05, -80.0);
      const double high = rt60(filtered(out.left, 2500.0f, true), kRate, 0.2, 0.05, -80.0);
      EXPECT_NEAR(low, decays[k], 0.1 * decays[k], "RT60 follows Decay");
      EXPECT(high < 0.9 * low && high > 0.4 * low, "the top of the band decays faster than the bottom");
    }
  }

  // Nothing comes back above the transition frequency (4.8 kHz at 48 kHz).
  {
    double level[3];
    const float tones[3] = {2000.0f, 5500.0f, 9000.0f};
    for (int k = 0; k < 3; ++k) {
      bare(device);
      Stereo out = run(device, sine(tones[k], 2.0f, kRate, 0.25f));
      level[k] = rms(out.left, 48000, 96000);
    }
    EXPECT(level[0] > 0.01, "a tone below the transition frequency rings");
    EXPECT(level[1] < 0.005 * level[0], "a tone just above the transition frequency is more than 46 dB down");
    EXPECT(level[2] < 0.001 * level[0], "a tone well above it is more than 60 dB down");
    bare(device);
    rng_state() = 0xBEADu;
    Stereo hiss = run(device, noise(2.0f, kRate, 0.3f));
    const double above = band_power(hiss.left, 48000, 5500.0, 24000.0);
    const double below = band_power(hiss.left, 48000, 20.0, 4800.0);
    EXPECT(below > 0.0 && above < 1.0e-5 * below, "white noise comes back 50 dB down above 5.5 kHz");
  }

  // Each spring adds its own echoes: the second spring's second echo falls
  // at 57 ms and the third's at 75 ms, between the first spring's.
  {
    double second_spring[3], third_spring[3], first_spring[3];
    for (int mode = 0; mode < 3; ++mode) {
      bare(device);
      device.set_param(p::kSprings, static_cast<float>(mode));
      device.set_param(p::kWidth, 0.0f);
      Stereo out = run(device, impulse(0.5f, kRate, 0.5f));
      std::vector<float> low = filtered(out.left, 900.0f, false);
      first_spring[mode] = rms(low, at_ms(63.5), at_ms(69.5));
      second_spring[mode] = rms(low, at_ms(54.5), at_ms(60.5));
      third_spring[mode] = rms(low, at_ms(73.0), at_ms(79.0));
    }
    EXPECT(second_spring[0] < 0.15 * first_spring[0] && third_spring[0] < 0.15 * first_spring[0],
           "One: only the first spring's echoes");
    EXPECT(second_spring[1] > 0.6 * first_spring[1] && third_spring[1] < 0.15 * first_spring[1],
           "Two: the second spring's echoes join");
    EXPECT(second_spring[2] > 0.6 * first_spring[2] && third_spring[2] > 0.6 * first_spring[2],
           "Three: the third spring's echoes join");
  }

  // Drip feeds the springs more of the band where the chirp is longest.
  {
    double share[2];
    for (int k = 0; k < 2; ++k) {
      bare(device);
      device.set_param(p::kDrip, k == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, impulse(1.0f, kRate, 0.25f));
      share[k] = std::sqrt(band_power(out.left, 0, 2500.0, 3800.0) / band_power(out.left, 0, 200.0, 1000.0));
    }
    EXPECT(share[1] > 2.2 * share[0], "Drip raises the chirp band by 7 dB or more over the bottom");
  }

  // Drive saturates the input: a tone gains a third harmonic.
  {
    double third[2];
    for (int k = 0; k < 2; ++k) {
      bare(device);
      device.set_param(p::kDrive, k == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, sine(400.0f, 2.0f, kRate, 0.3f));
      third[k] = tone_level(out.left, 1200.0, kRate, 48000, 96000) /
                 tone_level(out.left, 400.0, kRate, 48000, 96000);
    }
    EXPECT(third[1] > 5.0 * third[0] && third[1] > 0.02, "Drive adds harmonics");
  }

  // Tone is a low-pass on what the pickup hears.
  {
    double level[2];
    for (int k = 0; k < 2; ++k) {
      bare(device);
      device.set_param(p::kTone, k == 0 ? 6000.0f : 500.0f);
      rng_state() = 0xC0FFEEu;
      Stereo out = run(device, noise(2.0f, kRate, 0.3f));
      level[k] = rms(filtered(out.left, 2500.0f, true), 24000) / rms(out.left, 24000);
    }
    EXPECT(level[1] < 0.1 * level[0], "a low Tone takes the top off the springs");
  }

  // Pre-delay shifts the whole response by its setting.
  {
    bare(device);
    Stereo near = run(device, impulse(0.5f, kRate, 0.5f));
    bare(device);
    device.set_param(p::kPredelay, 100.0f);
    Stereo far = run(device, impulse(0.5f, kRate, 0.5f));
    double worst = 0.0;
    for (size_t i = 0; i + 4800 < near.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(far.left[i + 4800]) - near.left[i]));
    }
    EXPECT(peak(far.left, 0, 4800) < 1.0e-6, "nothing before the pre-delay has passed");
    EXPECT(worst < 0.05 * peak(near.left), "Pre-delay shifts the response by its setting");
  }

  // Two springs sit left and right; Width 0 folds them to mono.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0xABCDu;
    std::vector<float> burst = noise(2.0f, kRate, 0.3f);
    Stereo wide = run(device, burst);
    EXPECT(std::fabs(correlation(wide.left, wide.right, 24000)) < 0.3, "Width 1: the two springs are decorrelated");
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kWidth, 0.0f);
    rng_state() = 0xABCDu;
    Stereo mono = run(device, burst);
    double worst = 0.0;
    for (size_t i = 0; i < mono.size(); ++i) worst = std::max(worst, std::fabs((double)mono.left[i] - mono.right[i]));
    EXPECT(rms(mono.left) > 0.01 && worst == 0.0, "Width 0 is mono");
  }

  // The drift on each line: two identical hits a few seconds apart do not
  // come back identical, but nearly.
  {
    bare(device);
    device.set_param(p::kDecay, 1.0f);
    Stereo a = run(device, impulse(4.0f, kRate, 0.5f));
    Stereo b = run(device, impulse(4.0f, kRate, 0.5f));
    double difference = 0.0;
    for (size_t i = 0; i < 48000; ++i) difference = std::max(difference, std::fabs((double)a.left[i] - b.left[i]));
    EXPECT(difference > 1.0e-4 * peak(a.left), "the springs drift: no two hits are identical");
    EXPECT(correlation(a.left, b.left, 0, 9600) > 0.95, "the drift is slight");
  }

  // Bounded at the worst: longest decay, full drive and drip, a loud tone on
  // one of the spring's resonances and then loud noise.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kDecay, 6.0f);
    device.set_param(p::kDrive, 1.0f);
    device.set_param(p::kDrip, 1.0f);
    device.set_param(p::kSprings, 2.0f);
    // Odd multiples of 1 / (2 x 41.2 ms): the inverting loop's resonances.
    Stereo ringing = run(device, sine(497.57f, 6.0f, kRate, 0.9f));
    rng_state() = 0xFEEDu;
    Stereo loud = run(device, noise(6.0f, kRate, 0.9f));
    Stereo tail = render(device, 3.0f, kRate);
    EXPECT(finite(ringing.left) && finite(loud.left) && finite(tail.left), "the worst case stays finite");
    EXPECT(peak(ringing.left) < 4.0 && peak(loud.left) < 4.0 && peak(loud.right) < 4.0, "the worst case stays bounded");
    EXPECT(rms(tail.left, 96000, 144000) < 0.5 * rms(tail.left, 0, 48000), "and decays once the input stops");
  }

  // Moving the controls under a low note does not click.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, sine(110.0f, 2.0f, kRate, 0.5f));
    const double before = max_step(run(device, sine(110.0f, 0.5f, kRate, 0.5f)).left);
    device.set_param(p::kTension, 0.9f);
    device.set_param(p::kDecay, 5.0f);
    device.set_param(p::kSprings, 2.0f);
    device.set_param(p::kDrive, 0.6f);
    device.set_param(p::kDrip, 0.8f);
    device.set_param(p::kWidth, 0.2f);
    device.set_param(p::kMix, 0.6f);
    Stereo out = run(device, sine(110.0f, 1.0f, kRate, 0.5f));
    EXPECT(max_step(out.left) < before + 0.03, "moving Tension, Decay, Springs, Drive, Drip, Width and Mix does not click");
  }

  // The device sleeps: after the tail it does no work and returns exact zero.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 8.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, impulse(1.0f, kRate, 0.5f));
    EXPECT(peak(woken.left, 500, 4000) > 0.001, "wakes on new input");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("spring-reverb", 10.0f, kRate, [&] { run(device, input); });

  return finish("spring-reverb");
}
