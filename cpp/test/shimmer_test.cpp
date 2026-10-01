// Native harness for Shimmer (cpp/devices/shimmer). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a shimmer reverb: a tail whose
// length is the Decay setting and whose pitch climbs by the chosen interval
// on every pass.

#include "../devices/shimmer/shimmer.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Shimmer;
namespace p = livemix::shimmer;

static Shimmer device;

static const float kRate = 48000.0f;

// Level of everything within `half_width` Hz of `hz` over [from, to): the
// shifted partials are narrow bands, not lines, so one Goertzel bin would
// catch a varying share of them.
static double band_level(const std::vector<float>& x, double hz, size_t from, size_t to,
                         double half_width = 16.0) {
  const double bin = kRate / static_cast<double>(to - from);
  double power = 0.0;
  for (double f = hz - half_width; f <= hz + half_width; f += 2.0 * bin) {
    const double level = tone_level(x, f, kRate, from, to);
    power += level * level;
  }
  return std::sqrt(power);
}

// Energy-weighted mean time (seconds) of the band around `hz`, in 0.25 s steps.
static double band_centroid(const std::vector<float>& x, double hz) {
  const size_t window = static_cast<size_t>(0.25f * kRate);
  double weighted = 0.0, total = 0.0;
  for (size_t w = 0; (w + 1) * window <= x.size(); ++w) {
    const double level = band_level(x, hz, w * window, (w + 1) * window);
    weighted += level * level * (static_cast<double>(w) + 0.5) * 0.25;
    total += level * level;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// Wet only, no shimmer, no modulation, bright: the bare tank.
static void plain(Shimmer& d) {
  d.init(kRate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kShimmer, 0.0f);
  d.set_param(p::kModulation, 0.0f);
  d.set_param(p::kPredelay, 0.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kTone, 16000.0f);
}

// A 220 Hz note for one second with 50 ms fades (a gated sine would splash
// energy on every frequency), then silence up to `seconds` in all.
static std::vector<float> note(float seconds) {
  std::vector<float> x = sine(220.0f, 1.0f, kRate, 0.5f);
  const size_t fade = 2400;
  for (size_t i = 0; i < fade; ++i) {
    const float g = 0.5f - 0.5f * static_cast<float>(std::cos(kPi * static_cast<double>(i) / fade));
    x[i] *= g;
    x[x.size() - 1 - i] *= g;
  }
  x.resize(static_cast<size_t>(seconds * kRate), 0.0f);
  return x;
}

// Index of the first sample where two renders stop being the same signal at
// two levels (the level is taken from their first sample).
static size_t first_difference(const std::vector<float>& a, const std::vector<float>& b) {
  const double scale = static_cast<double>(a[0]) / b[0];
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    if (std::fabs(a[i] - scale * b[i]) > 1.0e-5 * std::fabs(a[0])) return i;
  }
  return a.size();
}

int main() {
  Conformance spec;
  spec.name = "shimmer";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 22.0f;
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

  // With Shimmer at 0 it is a reverb whose RT60 is the Decay setting.
  {
    double measured[2];
    const float decays[2] = {2.0f, 8.0f};
    for (int k = 0; k < 2; ++k) {
      plain(device);
      device.set_param(p::kDecay, decays[k]);
      rng_state() = 0x5EEDu;
      std::vector<float> burst = noise(0.2f, kRate, 0.5f);
      burst.resize(static_cast<size_t>(kRate * (decays[k] * 1.2f + 1.0f)), 0.0f);
      Stereo out = run(device, burst);
      measured[k] = rt60(out.left, kRate, 0.5, 0.1, -80.0);
    }
    EXPECT_NEAR(measured[0], 2.0, 0.3, "Decay 2 s gives an RT60 of 2 s");
    EXPECT_NEAR(measured[1], 8.0, 1.2, "Decay 8 s gives an RT60 of 8 s");
  }

  // The climb: a 220 Hz note comes back at 440 Hz and then at 880 Hz, each
  // later than the one below, and the late tail is the octaves.
  {
    plain(device);
    device.set_param(p::kDecay, 12.0f);
    device.set_param(p::kShimmer, 0.5f);
    Stereo out = run(device, note(8.0f));
    const double t220 = band_centroid(out.left, 220.0);
    const double t440 = band_centroid(out.left, 440.0);
    const double t880 = band_centroid(out.left, 880.0);
    const double t1760 = band_centroid(out.left, 1760.0);
    EXPECT(t440 > t220 + 0.2, "the octave arrives after the fundamental");
    EXPECT(t880 > t440 + 0.2, "the second octave arrives after the first");
    EXPECT(t1760 > t880 + 0.1, "the third octave arrives after the second");
    const size_t a = static_cast<size_t>(2.5f * kRate), b = static_cast<size_t>(3.5f * kRate);
    const double o1 = band_level(out.left, 440.0, a, b);
    const double o2 = band_level(out.left, 880.0, a, b);
    const double o3 = band_level(out.left, 1760.0, a, b);
    EXPECT(std::sqrt(o1 * o1 + o2 * o2 + o3 * o3) > 1.5 * band_level(out.left, 220.0, a, b),
           "the late tail is more octaves than note");
    // The shifted partial sits on the octave, not on a splice sideband.
    const double hz = dominant_frequency(out.left, kRate, 380.0, 500.0, 24000, 96000);
    EXPECT_NEAR(hz, 440.0, 1.0, "the first octave of 220 Hz is 440 Hz");

    // Shimmer 0: the same note leaves nothing at the octave.
    plain(device);
    device.set_param(p::kDecay, 12.0f);
    Stereo flat = run(device, note(8.0f));
    const size_t c = static_cast<size_t>(1.5f * kRate);
    EXPECT(band_level(flat.left, 440.0, c, b) < 0.001 * band_level(flat.left, 220.0, c, b),
           "Shimmer 0 puts no energy at the octave");
    EXPECT(band_level(out.left, 440.0, c, b) > 100.0 * band_level(flat.left, 440.0, c, b),
           "Shimmer raises the octave by more than 40 dB");
  }

  // The shifter is smooth: under a held note the octave is one steady tone,
  // without the flutter of heads splicing out of phase.
  {
    plain(device);
    device.set_param(p::kShimmer, 0.5f);
    Stereo out = run(device, sine(220.0f, 8.0f, kRate, 0.3f));
    double worst = 0.0, lowest = 1.0e9;
    double previous = tone_level(out.left, 440.0, kRate, 4 * 48000, 4 * 48000 + 2400);
    for (size_t from = 4 * 48000 + 2400; from + 2400 <= out.size(); from += 2400) {
      const double level = tone_level(out.left, 440.0, kRate, from, from + 2400);
      worst = std::max(worst, std::fabs(db(level) - db(previous)));
      lowest = std::min(lowest, level);
      previous = level;
    }
    EXPECT(lowest > 0.02, "a held note has a steady octave above it");
    EXPECT(worst < 0.5, "the octave's level moves by less than 0.5 dB from one 50 ms to the next");
    const size_t a = 4 * 48000, b = 8 * 48000;
    EXPECT(tone_level(out.left, 440.0, kRate, a, b) > 0.9 * band_level(out.left, 440.0, a, b, 30.0),
           "the octave is a line, not a band of splice noise");
  }

  // Interval sets the ratio of each step.
  {
    const double ratios[5] = {2.0, 1.5, 3.0, 0.5, 4.0};
    const char* names[5] = {"Octave up lands on 2x", "Fifth up lands on 1.5x",
                            "Octave and fifth lands on 3x", "Octave down lands on 0.5x",
                            "Two octaves lands on 4x"};
    for (int interval = 0; interval < 5; ++interval) {
      plain(device);
      device.set_param(p::kDecay, 12.0f);
      device.set_param(p::kShimmer, 0.5f);
      device.set_param(p::kInterval, static_cast<float>(interval));
      Stereo out = run(device, note(2.0f));
      const size_t a = 24000, b = 96000;
      const double target = band_level(out.left, 220.0 * ratios[interval], a, b);
      double others = 0.0;
      for (int other = 0; other < 5; ++other) {
        // Skip itself and its own second step (2 x 2 = 4).
        if (other == interval || ratios[other] == ratios[interval] * ratios[interval]) continue;
        others = std::max(others, band_level(out.left, 220.0 * ratios[other], a, b));
      }
      EXPECT(target > 0.02 && target > 10.0 * others, names[interval]);
    }
  }

  // The worst case stays bounded and still decays: everything up, loud input.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kDecay, 30.0f);
    device.set_param(p::kShimmer, 1.0f);
    device.set_param(p::kSize, 1.0f);
    device.set_param(p::kTone, 16000.0f);
    rng_state() = 0xFEEDu;
    Stereo loud = run(device, noise(8.0f, kRate, 0.9f));
    Stereo more = run(device, sine(110.0f, 8.0f, kRate, 0.9f));
    Stereo tail = render(device, 12.0f, kRate);
    EXPECT(finite(loud.left) && finite(more.left) && finite(tail.left), "maximum Shimmer and Decay stay finite");
    EXPECT(peak(loud.left) < 4.0 && peak(more.left) < 4.0 && peak(tail.right) < 4.0,
           "maximum Shimmer and Decay stay bounded");
    const size_t n = tail.left.size();
    EXPECT(rms(tail.left, n - 48000, n) < 0.7 * rms(tail.left, 0, 48000),
           "maximum Shimmer and Decay still decay once the input stops");
  }

  // Tone is the damping: a low setting leaves a darker tail.
  {
    double bright_share = 0.0, dark_share = 0.0;
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kDecay, 6.0f);
      device.set_param(p::kTone, pass == 0 ? 12000.0f : 1000.0f);
      rng_state() = 0xC0FFEEu;
      std::vector<float> burst = noise(0.2f, kRate, 0.5f);
      burst.resize(static_cast<size_t>(kRate * 2.0f), 0.0f);
      Stereo out = run(device, burst);
      (pass == 0 ? bright_share : dark_share) = energy_above(out.left, 3000.0, kRate, 48000, 96000);
    }
    EXPECT(bright_share > 0.05, "a bright Tone keeps treble in the tail");
    EXPECT(dark_share < 0.2 * bright_share, "a low Tone darkens the tail");
  }

  // Size scales the lines: the tank first answers after its shortest line,
  // 41.35 ms x (0.5 + Size). The early signal does not depend on Size (but
  // for the wet level), so two renders match until the smaller room's first
  // return.
  {
    Stereo rooms[3];
    const float sizes[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      plain(device);
      device.set_param(p::kSize, sizes[k]);
      rooms[k] = run(device, impulse(1.0f, kRate, 0.5f));
    }
    const double small = static_cast<double>(first_difference(rooms[0].left, rooms[2].left)) / kRate;
    const double medium = static_cast<double>(first_difference(rooms[1].left, rooms[2].left)) / kRate;
    EXPECT_NEAR(small, 0.041354 * 0.5, 0.0001, "Size 0: the tank answers after 20.7 ms");
    EXPECT_NEAR(medium, 0.041354, 0.0001, "Size 0.5: the tank answers after 41.4 ms");
  }

  // Pre-delay holds the whole wet signal back by its setting.
  {
    plain(device);
    device.set_param(p::kPredelay, 200.0f);
    Stereo out = run(device, impulse(1.0f, kRate, 0.5f));
    EXPECT(peak(out.left, 0, 9590) < 1.0e-6, "nothing before the pre-delay has passed");
    EXPECT(peak(out.left, 9600, 9700) > 0.01, "the reverb starts at the pre-delay");
    plain(device);
    Stereo direct = run(device, impulse(0.1f, kRate, 0.5f));
    EXPECT(peak(direct.left, 0, 100) > 0.01, "with no pre-delay the reverb starts at once");
  }

  // Modulation moves the lines: a held tone is spread away from its line.
  {
    double share[2];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kDecay, 6.0f);
      device.set_param(p::kModulation, pass == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, sine(1000.0f, 6.0f, kRate, 0.25f));
      const size_t a = 2 * 48000, b = 6 * 48000;
      share[pass] = tone_level(out.left, 1000.0, kRate, a, b) / (std::sqrt(2.0) * rms(out.left, a, b));
    }
    EXPECT(share[0] > 0.98, "without Modulation a held tone stays one line");
    EXPECT(share[1] < 0.8, "Modulation spreads a held tone");
  }

  // Low Cut removes the bottom of the wet signal.
  {
    double level[2];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kLowCut, pass == 0 ? 20.0f : 1000.0f);
      Stereo out = run(device, sine(80.0f, 3.0f, kRate, 0.25f));
      level[pass] = tone_level(out.left, 80.0, kRate, 48000, 144000);
    }
    EXPECT(level[0] > 0.01, "bass reverberates with Low Cut down");
    EXPECT(level[1] < 0.02 * level[0], "Low Cut removes it");
  }

  // Width 0 is mono, Width 1 is decorrelated.
  {
    plain(device);
    device.set_param(p::kShimmer, 0.5f);
    device.set_param(p::kModulation, 0.5f);
    device.set_param(p::kWidth, 0.0f);
    rng_state() = 0xABCDu;
    std::vector<float> burst = noise(2.0f, kRate, 0.3f);
    Stereo mono = run(device, burst);
    double worst = 0.0;
    for (size_t i = 0; i < mono.size(); ++i) worst = std::max(worst, std::fabs((double)mono.left[i] - mono.right[i]));
    EXPECT(rms(mono.left) > 0.01 && worst == 0.0, "Width 0 is mono");
    plain(device);
    device.set_param(p::kShimmer, 0.5f);
    rng_state() = 0xABCDu;
    Stereo wide = run(device, burst);
    EXPECT(std::fabs(correlation(wide.left, wide.right, 24000)) < 0.3, "Width 1 decorrelates the sides");
  }

  // Moving the controls while a low note rings does not click. A 55 Hz
  // sine steps by 0.007 per sample at full scale, so a click stands out.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, sine(55.0f, 2.0f, kRate, 0.5f));
    const double before = max_step(run(device, sine(55.0f, 0.5f, kRate, 0.5f)).left);
    device.set_param(p::kShimmer, 1.0f);
    device.set_param(p::kSize, 0.9f);
    device.set_param(p::kPredelay, 120.0f);
    device.set_param(p::kMix, 0.6f);
    device.set_param(p::kDecay, 20.0f);
    device.set_param(p::kWidth, 0.3f);
    Stereo out = run(device, sine(55.0f, 0.5f, kRate, 0.5f));
    EXPECT(max_step(out.left) < before + 0.02, "moving Shimmer, Size, Pre-delay, Decay, Width and Mix does not click");
    device.set_param(p::kInterval, 1.0f);
    Stereo stepped = run(device, sine(55.0f, 0.5f, kRate, 0.5f));
    EXPECT(max_step(stepped.left) < before + 0.03, "changing Interval does not click");
  }

  // The device sleeps: after the tail it does no work and returns exact zero.
  {
    device.init(kRate);
    device.set_param(p::kDecay, 2.0f);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 7.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, impulse(1.0f, kRate, 0.5f));
    EXPECT(peak(woken.left, 2000, 20000) > 0.001, "wakes on new input");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("shimmer", 10.0f, kRate, [&] { run(device, input); });

  return finish("shimmer");
}
