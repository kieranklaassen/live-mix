// Native harness for Expanse (cpp/devices/expanse). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a very large playable space: decay
// that follows the control up to infinite, a Size that scales when the first
// sound returns, a Gravity that makes the onset swell, and a Freeze that
// holds.

#include "../devices/expanse/expanse.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Expanse;
namespace p = livemix::expanse;

static Expanse device;

static const float kRate = 48000.0f;

// The Size time in seconds for a Size setting (40 ms to 2.5 s, log).
static double size_seconds(float size) { return 0.04 * std::pow(2.5 / 0.04, size); }

// Wet only, no modulation, cut filters out of the way.
static void bare(Expanse& d) {
  d.init(kRate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kModDepth, 0.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kHighCut, 18000.0f);
}

static size_t first_sound(const std::vector<float>& x) {
  for (size_t i = 0; i < x.size(); ++i) {
    if (x[i] != 0.0f) return i;
  }
  return x.size();
}

// Echo density after Abel and Huang: the share of samples in [from, to)
// further from zero than one standard deviation, over what Gaussian noise
// gives (0.3173). Near 0 for a few separate echoes, 1 for a dense wash.
static double echo_density(const std::vector<float>& x, size_t from, size_t to) {
  const double sigma = rms(x, from, to);
  if (sigma <= 0.0) return 0.0;
  size_t count = 0;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > sigma) ++count;
  }
  return static_cast<double>(count) / (0.3173 * static_cast<double>(to - from));
}

// Energy-weighted mean time in seconds.
static double centroid(const std::vector<float>& x) {
  double weighted = 0.0, total = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    const double e = static_cast<double>(x[i]) * x[i];
    weighted += e * static_cast<double>(i);
    total += e;
  }
  return total > 0.0 ? weighted / total / kRate : 0.0;
}

// Three mid-range partials for `seconds`, with 50 ms fades.
static std::vector<float> chord(float seconds, float gain) {
  std::vector<float> x(static_cast<size_t>(seconds * kRate));
  for (size_t i = 0; i < x.size(); ++i) {
    const double t = static_cast<double>(i) / kRate;
    x[i] = gain * static_cast<float>(std::sin(2.0 * kPi * 440.0 * t) + std::sin(2.0 * kPi * 659.3 * t) +
                                     std::sin(2.0 * kPi * 987.8 * t)) / 3.0f;
  }
  const size_t fade = 2400;
  for (size_t i = 0; i < fade && i < x.size(); ++i) {
    const float g = 0.5f - 0.5f * static_cast<float>(std::cos(kPi * static_cast<double>(i) / fade));
    x[i] *= g;
    x[x.size() - 1 - i] *= g;
  }
  return x;
}

int main() {
  Conformance spec;
  spec.name = "expanse";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 30.0f;
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

  // RT60 is the Decay setting, at any Size.
  {
    const float decays[2] = {3.0f, 12.0f};
    const float sizes[2] = {0.3f, 0.7f};
    for (int k = 0; k < 2; ++k) {
      for (int s = 0; s < 2; ++s) {
        bare(device);
        device.set_param(p::kDecay, decays[k]);
        device.set_param(p::kSize, sizes[s]);
        rng_state() = 0x5EEDu;
        std::vector<float> burst = noise(0.2f, kRate, 0.5f);
        burst.resize(static_cast<size_t>(kRate * (decays[k] * 1.2f + 2.0f)), 0.0f);
        Stereo out = run(device, burst);
        const double measured = rt60(out.left, kRate, 1.5, 0.25, -80.0);
        EXPECT_NEAR(measured, decays[k], 0.15 * decays[k], "RT60 follows Decay");
      }
    }
  }

  // The top of Decay is infinite: a chord is still there a minute later, no
  // quieter and no louder.
  {
    bare(device);
    device.set_param(p::kDecay, p::kParamMax[p::kDecay]);
    run(device, chord(2.0f, 0.4f));
    Stereo tail = render(device, 60.0f, kRate);
    const double early = rms(tail.left, 5 * 48000, 15 * 48000);
    const double late = rms(tail.left, 50 * 48000, 60 * 48000);
    EXPECT(early > 0.01, "an infinite decay holds a chord");
    EXPECT(late > 0.8 * early && late < 1.1 * early, "an infinite decay neither fades nor grows over a minute");
  }

  // Size scales the space: the first sound returns after 0.09 of the Size
  // time on the left, and a smaller space packs more echoes into a second.
  {
    double arrival[2], density[2];
    const float sizes[2] = {0.25f, 0.75f};
    for (int k = 0; k < 2; ++k) {
      bare(device);
      device.set_param(p::kSize, sizes[k]);
      Stereo out = run(device, impulse(1.0f, kRate, 0.5f));
      arrival[k] = static_cast<double>(first_sound(out.left)) / kRate;
      EXPECT_NEAR(arrival[k], 0.127 * 0.7071 * size_seconds(sizes[k]), 0.0005,
                  "the first sound returns after 0.09 of the Size time");

      // With Density at 0 the echoes are separate: how full is the second
      // half second?
      bare(device);
      device.set_param(p::kSize, sizes[k]);
      device.set_param(p::kDensity, 0.0f);
      Stereo sparse = run(device, impulse(1.0f, kRate, 0.5f));
      density[k] = echo_density(sparse.left, 24000, 48000);
    }
    EXPECT(arrival[1] > 7.0 * arrival[0], "a larger Size answers later");
    EXPECT(density[0] > 0.3 && density[1] < 0.1 * density[0], "a smaller Size has a higher echo density");
  }

  // Density turns separate echoes into a wash.
  {
    double crest[2], density[2];
    for (int k = 0; k < 2; ++k) {
      bare(device);
      device.set_param(p::kDensity, k == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, impulse(1.5f, kRate, 0.5f));
      // The first pass: 0.1 to 0.4 s at the default Size.
      density[k] = echo_density(out.left, 4800, 19200);
      crest[k] = peak(out.left, 24000, 72000) / rms(out.left, 24000, 72000);
    }
    EXPECT(density[0] < 0.1 && density[1] > 0.6, "Density fills the gaps between echoes");
    EXPECT(crest[0] > 3.0 * crest[1], "Density flattens the echoes into a wash");
  }

  // Gravity makes the onset swell: the energy of an impulse response moves
  // later by about half the Size time, and its start empties.
  {
    const float size = 0.7f;
    const double seconds = size_seconds(size);
    double centre[3], onset[3], loudest[3];
    for (int k = 0; k < 3; ++k) {
      bare(device);
      device.set_param(p::kSize, size);
      device.set_param(p::kDecay, 4.0f);
      device.set_param(p::kGravity, 0.5f * static_cast<float>(k));
      Stereo out = run(device, impulse(8.0f, kRate, 0.5f));
      centre[k] = centroid(out.left);
      onset[k] = rms(out.left, 0, static_cast<size_t>(0.4 * seconds * kRate));
      // Start of the loudest 50 ms.
      double best = 0.0;
      loudest[k] = 0.0;
      for (size_t w = 0; (w + 1) * 2400 <= out.size(); ++w) {
        const double level = rms(out.left, w * 2400, (w + 1) * 2400);
        if (level > best) {
          best = level;
          loudest[k] = static_cast<double>(w) * 0.05;
        }
      }
    }
    EXPECT(centre[1] > centre[0] + 0.1 * seconds && centre[2] > centre[1] + 0.1 * seconds,
           "Gravity moves the energy of an impulse response later");
    EXPECT(centre[2] - centre[0] > 0.35 * seconds && centre[2] - centre[0] < 0.8 * seconds,
           "full Gravity delays the energy by about half the Size time");
    EXPECT(onset[2] < 0.3 * onset[0], "full Gravity takes 10 dB or more out of the onset");
    EXPECT(loudest[2] > loudest[0] + 0.3 * seconds, "full Gravity peaks later");
  }

  // Freeze: the input is shut out and what is inside holds its level.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0xF00Du;
    run(device, noise(3.0f, kRate, 0.3f));
    device.set_param(p::kFreeze, 1.0f);
    render(device, 0.5f, kRate);
    Stereo held = render(device, 30.0f, kRate);
    const double first = rms(held.left, 0, 2 * 48000);
    double lowest = first, highest = first;
    for (int w = 1; w < 15; ++w) {
      const double level = rms(held.left, w * 96000, (w + 1) * 96000);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    EXPECT(first > 0.01, "Freeze holds sound");
    EXPECT(db(highest) - db(first) < 1.0 && db(first) - db(lowest) < 1.0,
           "Freeze holds the level within 1 dB for 30 s");
    const double last = rms(held.left, 28 * 48000, 30 * 48000);
    EXPECT(last < 1.06 * first, "a frozen space does not grow");
    EXPECT(std::fabs(correlation(held.left, held.right)) < 0.3, "a frozen space stays wide");

    // Unfreezing lets it decay at the Decay setting again.
    device.set_param(p::kDecay, 2.0f);
    device.set_param(p::kFreeze, 0.0f);
    Stereo released = render(device, 5.0f, kRate);
    EXPECT(rms(released.left, 4 * 48000, 5 * 48000) < 0.01 * first, "unfreezing lets the space decay");

    // Frozen before any sound: nothing gets in.
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kFreeze, 1.0f);
    Stereo shut = run(device, noise(2.0f, kRate, 0.9f));
    EXPECT(peak(shut.left) == 0.0 && peak(shut.right) == 0.0, "Freeze shuts the input out");

    // Closing and opening it under a low note does not click.
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, sine(55.0f, 2.0f, kRate, 0.5f));
    const double before = max_step(run(device, sine(55.0f, 0.5f, kRate, 0.5f)).left);
    device.set_param(p::kFreeze, 1.0f);
    const double closing = max_step(run(device, sine(55.0f, 0.5f, kRate, 0.5f)).left);
    device.set_param(p::kFreeze, 0.0f);
    const double opening = max_step(run(device, sine(55.0f, 0.5f, kRate, 0.5f)).left);
    EXPECT(closing < before + 0.01 && opening < before + 0.01, "Freeze transitions do not click");
  }

  // Modulation spreads a held tone; a faster rate spreads it wider.
  {
    double share[2];
    for (int k = 0; k < 2; ++k) {
      bare(device);
      device.set_param(p::kDecay, 6.0f);
      device.set_param(p::kModDepth, k == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, sine(1000.0f, 8.0f, kRate, 0.25f));
      const size_t a = 3 * 48000, b = 8 * 48000;
      share[k] = tone_level(out.left, 1000.0, kRate, a, b) / (std::sqrt(2.0) * rms(out.left, a, b));
    }
    EXPECT(share[0] > 0.98, "without modulation a held tone stays one line");
    EXPECT(share[1] < 0.7, "Mod Depth spreads a held tone");

    double near[2];
    const float rates[2] = {0.1f, 3.0f};
    for (int k = 0; k < 2; ++k) {
      bare(device);
      device.set_param(p::kDecay, 6.0f);
      device.set_param(p::kModDepth, 1.0f);
      device.set_param(p::kModRate, rates[k]);
      Stereo out = run(device, sine(1000.0f, 13.0f, kRate, 0.25f));
      const size_t a = 3 * 48000, b = 13 * 48000;
      // Energy within 1.5 Hz of the tone, as a share of all of it.
      double power = 0.0;
      for (double hz = 998.5; hz <= 1001.5; hz += 0.2) {
        const double level = tone_level(out.left, hz, kRate, a, b);
        power += level * level;
      }
      near[k] = std::sqrt(power) / (std::sqrt(2.0) * rms(out.left, a, b));
    }
    EXPECT(near[0] > 2.0 * near[1], "a faster Mod Rate pushes the energy further from the tone");
  }

  // The cut filters work inside the loop: the tail loses what they cut.
  {
    double treble[2], bass[2];
    for (int k = 0; k < 2; ++k) {
      bare(device);
      device.set_param(p::kHighCut, k == 0 ? 18000.0f : 1000.0f);
      rng_state() = 0xC0FFEEu;
      std::vector<float> burst = noise(0.3f, kRate, 0.5f);
      burst.resize(static_cast<size_t>(kRate * 4.0f), 0.0f);
      Stereo out = run(device, burst);
      treble[k] = energy_above(out.left, 4000.0, kRate, 96000, 192000);

      bare(device);
      device.set_param(p::kLowCut, k == 0 ? 20.0f : 1000.0f);
      Stereo low = run(device, sine(100.0f, 4.0f, kRate, 0.25f));
      bass[k] = tone_level(low.left, 100.0, kRate, 96000, 192000);
    }
    EXPECT(treble[0] > 0.2 && treble[1] < 0.02 * treble[0], "High Cut removes the top of the tail");
    EXPECT(bass[0] > 0.01 && bass[1] < 0.05 * bass[0], "Low Cut removes the bottom");
  }

  // Width 0 is mono, Width 1 is decorrelated.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kWidth, 0.0f);
    rng_state() = 0xABCDu;
    std::vector<float> burst = noise(3.0f, kRate, 0.3f);
    Stereo mono = run(device, burst);
    double worst = 0.0;
    for (size_t i = 0; i < mono.size(); ++i) worst = std::max(worst, std::fabs((double)mono.left[i] - mono.right[i]));
    EXPECT(rms(mono.left) > 0.01 && worst == 0.0, "Width 0 is mono");
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0xABCDu;
    Stereo wide = run(device, burst);
    EXPECT(std::fabs(correlation(wide.left, wide.right, 48000)) < 0.3, "Width 1 decorrelates the sides");
  }

  // Bounded at the worst: infinite decay, full density, loud noise for 20 s,
  // then the Size swept under it.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kDecay, p::kParamMax[p::kDecay]);
    device.set_param(p::kDensity, 1.0f);
    device.set_param(p::kSize, 0.2f);
    device.set_param(p::kLowCut, 20.0f);
    device.set_param(p::kHighCut, 18000.0f);
    rng_state() = 0xFEEDu;
    Stereo loud = run(device, noise(20.0f, kRate, 0.9f));
    device.set_param(p::kSize, 1.0f);
    Stereo swept = run(device, noise(3.0f, kRate, 0.9f));
    device.set_param(p::kSize, 0.0f);
    device.set_param(p::kFreeze, 1.0f);
    Stereo tail = render(device, 10.0f, kRate);
    EXPECT(finite(loud.left) && finite(swept.left) && finite(tail.left), "infinite decay with loud noise stays finite");
    EXPECT(peak(loud.left) < 4.0 && peak(loud.right) < 4.0 && peak(swept.left) < 4.0 && peak(tail.left) < 4.0,
           "infinite decay with loud noise stays bounded");
    const size_t n = tail.left.size();
    EXPECT(rms(tail.left, n - 96000, n) < 1.1 * rms(tail.left, 96000, 192000),
           "a saturated frozen space does not grow");
  }

  // Moving the controls under a low note does not click.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, sine(55.0f, 2.0f, kRate, 0.5f));
    const double before = max_step(run(device, sine(55.0f, 0.5f, kRate, 0.5f)).left);
    device.set_param(p::kGravity, 0.8f);
    device.set_param(p::kDensity, 0.3f);
    device.set_param(p::kDecay, 30.0f);
    device.set_param(p::kMix, 0.6f);
    device.set_param(p::kWidth, 0.2f);
    device.set_param(p::kSize, 0.6f);
    Stereo out = run(device, sine(55.0f, 1.0f, kRate, 0.5f));
    EXPECT(max_step(out.left) < before + 0.02, "moving Gravity, Density, Decay, Size, Width and Mix does not click");
  }

  // Not frozen, the device sleeps after its tail and returns exact zero.
  {
    device.init(kRate);
    device.set_param(p::kDecay, 1.0f);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 9.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, impulse(1.0f, kRate, 0.5f));
    EXPECT(peak(woken.left, 500, 40000) > 0.001, "wakes on new input");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("expanse", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kGravity, 1.0f);
  report_cost("expanse with Gravity", 10.0f, kRate, [&] { run(device, input); });

  return finish("expanse");
}
