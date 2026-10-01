// Native harness for Bloom (cpp/devices/bloom-reverb). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it Bloom: a decay time that follows the
// control, and a tail whose pitch moves by the chosen interval, further the
// longer it rings.
//
// The drifter reads the tail through reversed 6144-sample grains that start
// every 768 samples, so a steady tone only comes back where (1 + ratio) x its
// frequency sits on a multiple of rate / 768. At 48 kHz that grid is 62.5 Hz,
// which 500 Hz meets at unison, a fifth and an octave in both directions:
// the pitch checks use 500 Hz for that reason.

#include <complex>

#include "../devices/bloom-reverb/bloom_reverb.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::BloomReverb;
namespace p = livemix::bloom_reverb;

static BloomReverb device;

static const float kRate = 48000.0f;

static void fft(std::vector<std::complex<double>>& a) {
  const size_t n = a.size();
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const double angle = -2.0 * kPi / static_cast<double>(len);
    const std::complex<double> step(std::cos(angle), std::sin(angle));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w(1.0, 0.0);
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= step;
      }
    }
  }
}

// Power-weighted mean frequency of x[from, from + n) between 40 Hz and
// 12 kHz (Hann window, n a power of two).
static double centroid(const std::vector<float>& x, double rate, size_t from, size_t n) {
  std::vector<std::complex<double>> bins(n);
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    bins[i] = from + i < x.size() ? w * x[from + i] : 0.0;
  }
  fft(bins);
  double weighted = 0.0, total = 0.0;
  for (size_t i = 0; i < n / 2; ++i) {
    const double hz = static_cast<double>(i) * rate / static_cast<double>(n);
    if (hz < 40.0 || hz > 12000.0) continue;
    weighted += hz * std::norm(bins[i]);
    total += std::norm(bins[i]);
  }
  return total > 0.0 ? weighted / total : 0.0;
}

static double side_to_mid(const Stereo& audio, size_t from, size_t to) {
  double mid = 0.0, side = 0.0;
  for (size_t i = from; i < to && i < audio.size(); ++i) {
    const double m = 0.5 * (audio.left[i] + audio.right[i]);
    const double s = 0.5 * (audio.left[i] - audio.right[i]);
    mid += m * m;
    side += s * s;
  }
  return std::sqrt(side / std::max(mid, 1.0e-30));
}

static size_t at(float seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

// Wet only, at the given rate.
static void wet(BloomReverb& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
}

// The tail of a one-second 500 Hz note: its centroid just after the note and
// three seconds later.
struct Drift {
  double early, late;
};
static Drift tail_drift(float bloom, int direction, int interval) {
  wet(device);
  device.set_param(p::kBloom, bloom);
  device.set_param(p::kDirection, static_cast<float>(direction));
  device.set_param(p::kInterval, static_cast<float>(interval));
  run(device, sine(500.0f, 1.0f, kRate, 0.25f));
  Stereo tail = render(device, 4.0f, kRate);
  return {centroid(tail.left, kRate, at(0.1f), 32768), centroid(tail.left, kRate, at(3.0f), 32768)};
}

// A 500 Hz tone held for five seconds at Decay 1 and Bloom 1: after two
// seconds every line has reached its full age, so the drifter plays the
// whole interval. Returns the last second, wet only.
static std::vector<float> held_at_full_age(int direction, int interval, float rate = kRate) {
  wet(device, rate);
  device.set_param(p::kBloom, 1.0f);
  device.set_param(p::kDecay, 1.0f);
  device.set_param(p::kDirection, static_cast<float>(direction));
  device.set_param(p::kInterval, static_cast<float>(interval));
  Stereo held = run(device, sine(500.0f, 5.0f, rate, 0.25f));
  return std::vector<float>(held.left.begin() + static_cast<long>(at(4.0f, rate)), held.left.end());
}

static double noise_rt60(float decay, float bloom, float rate = kRate) {
  wet(device, rate);
  device.set_param(p::kBloom, bloom);
  device.set_param(p::kDecay, decay);
  rng_state() = 0x99u;
  run(device, noise(0.5f, rate, 0.02f));
  Stereo tail = render(device, decay * 1.2f + 1.0f, rate);
  return rt60(tail.left, rate, 0.6, 0.1, -110.0);
}

int main() {
  Conformance spec;
  spec.name = "bloom-reverb";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 16.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // The decay time is the Decay control.
  {
    const double two = noise_rt60(2.0f, 0.0f);
    const double eight = noise_rt60(8.0f, 0.0f);
    EXPECT_NEAR(two, 2.0, 0.3, "Decay 2 s rings for 2 s (RT60)");
    EXPECT_NEAR(eight, 8.0, 1.2, "Decay 8 s rings for 8 s (RT60)");
    EXPECT(eight > 3.2 * two, "four times the Decay is four times the tail");
    // The re-injected drift adds little energy: Bloom does not stretch the tail.
    EXPECT_NEAR(noise_rt60(5.0f, 1.0f), noise_rt60(5.0f, 0.0f), 0.75, "Bloom leaves the decay time alone");
  }

  // The loop is damped: the tail loses its top as it rings.
  {
    wet(device);
    device.set_param(p::kBloom, 0.0f);
    rng_state() = 0x99u;
    run(device, noise(0.5f, kRate, 0.05f));
    Stereo tail = render(device, 4.0f, kRate);
    const double early = energy_above(tail.left, 2500.0, kRate, at(0.3f), at(1.3f));
    const double late = energy_above(tail.left, 2500.0, kRate, at(3.0f), at(4.0f));
    EXPECT(early > 0.05 && late < 0.75 * early, "the tail darkens: highs decay faster than the body");
  }

  // Nothing comes back before the shortest line has gone round once (109 ms
  // plus the diffusers), and Mix 1 carries no dry signal.
  {
    wet(device);
    Stereo out = run(device, impulse(1.0f, kRate, 0.5f));
    EXPECT(peak(out.left, 0, at(0.1f)) < 1.0e-6 && peak(out.right, 0, at(0.1f)) < 1.0e-6,
           "Mix 1 is the network alone: silent until the shortest line returns");
    EXPECT(peak(out.left, at(0.1f), at(0.5f)) > 1.0e-3, "the first return follows the shortest line");
  }

  // Bloom 0: the tail of a note stays on the note.
  {
    const Drift still = tail_drift(0.0f, 0, 1);
    EXPECT_NEAR(still.early, 500.0, 10.0, "Bloom 0: the tail starts on the played pitch");
    EXPECT_NEAR(still.late, 500.0, 10.0, "Bloom 0: and is still on it three seconds later");
  }

  // Bloom up: the tail leaves the note in the chosen direction, and has gone
  // further three seconds later (the lines have aged, and what recirculates
  // has been shifted again).
  {
    const Drift up = tail_drift(1.0f, 0, 1);
    EXPECT(up.early > 600.0, "Up: the tail starts above the played pitch");
    EXPECT(up.late > up.early * 1.1, "Up: and keeps climbing as it rings");
    const Drift down = tail_drift(1.0f, 1, 1);
    EXPECT(down.early < 430.0, "Down: the tail starts below the played pitch");
    EXPECT(down.late < down.early * 0.93, "Down: and keeps falling as it rings");
    const Drift half = tail_drift(0.5f, 0, 1);
    EXPECT(half.early > 520.0 && half.early < up.early - 40.0, "half the Bloom moves the tail less far");
  }

  // Interval sets the ratio a fully aged tail arrives at.
  {
    const std::vector<float> octave = held_at_full_age(0, 1);
    EXPECT_NEAR(dominant_frequency(octave, kRate, 100.0, 4000.0), 1000.0, 3.0, "Octave up: 500 Hz returns at 1000 Hz");
    EXPECT(tone_level(octave, 750.0, kRate) < 0.05 * tone_level(octave, 1000.0, kRate),
           "Octave: nothing at the fifth");
    // The second trip round the loop shifts the shifted signal again.
    EXPECT(tone_level(octave, 2000.0, kRate) > 0.04 * tone_level(octave, 1000.0, kRate),
           "the drift is fed back: a second generation appears two octaves up");

    const std::vector<float> fifth = held_at_full_age(0, 0);
    EXPECT_NEAR(dominant_frequency(fifth, kRate, 100.0, 4000.0), 750.0, 3.0, "5th up: 500 Hz returns at 750 Hz");
    EXPECT(tone_level(fifth, 1000.0, kRate) < 0.05 * tone_level(fifth, 750.0, kRate), "5th: nothing at the octave");
    EXPECT(tone_level(fifth, 1125.0, kRate) > 0.04 * tone_level(fifth, 750.0, kRate),
           "5th: the second generation is a fifth above the first");

    const std::vector<float> both = held_at_full_age(0, 2);
    const double at_fifth = tone_level(both, 750.0, kRate), at_octave = tone_level(both, 1000.0, kRate);
    EXPECT(at_fifth > 0.02 && at_octave > 0.02 && at_fifth < 2.0 * at_octave && at_octave < 2.0 * at_fifth,
           "5th+Oct: both intervals, about equally");

    const std::vector<float> below = held_at_full_age(1, 1);
    EXPECT_NEAR(dominant_frequency(below, kRate, 100.0, 4000.0), 250.0, 3.0, "Octave down: 500 Hz returns at 250 Hz");
  }

  // Width 0 is mono, the default is the two decorrelated drifters, and more
  // Width pushes the side up.
  {
    double sides[3];
    const float widths[3] = {0.0f, 0.5f, 0.75f};
    for (int w = 0; w < 3; ++w) {
      wet(device);
      device.set_param(p::kWidth, widths[w]);
      rng_state() = 0x55u;
      Stereo out = run(device, noise(2.0f, kRate, 0.25f));
      if (w == 0) {
        EXPECT(rms(out.left) > 1.0e-3 && out.left == out.right, "Width 0 is mono, bit for bit");
      }
      if (w == 1) {
        EXPECT(correlation(out.left, out.right, at(1.0f)) < 0.5, "at the default Width the tail is wide");
      }
      sides[w] = side_to_mid(out, at(1.0f), at(2.0f));
    }
    EXPECT(sides[1] > 0.5 && sides[2] > 1.5 * sides[1], "Width past the default raises the side signal");
  }

  // Mix 0 is the dry signal untouched.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 0; i < tone.size(); ++i) worst = std::max(worst, std::fabs(out.left[i] - (double)tone[i]));
    EXPECT(worst < 1.0e-6, "Mix 0 passes the input through");
    // The tail it did not let out is still ringing inside, not frozen.
    render(device, 2.0f, kRate);
    device.set_param(p::kMix, 1.0f);
    Stereo opened = render(device, 1.0f, kRate);
    EXPECT(rms(opened.left) > 1.0e-4, "raising Mix later finds the tail still decaying");
  }

  // The default patch sits under its input: the wet path has 9 dB of headroom.
  {
    device.init(kRate);
    rng_state() = 0x77u;
    std::vector<float> input = noise(4.0f, kRate, 0.25f);
    Stereo out = run(device, input);
    EXPECT(peak(out.left) < 1.2 * 0.25, "defaults: no louder than the input");
    EXPECT(rms(out.left, at(2.0f)) > 0.5 * rms(input), "defaults: the dry signal is still there");
  }

  // Bounded and silent in the end at every extreme of the feedback path: the
  // longest decay with the drift re-injection fully open, in each direction.
  {
    const int combos[4][2] = {{0, 2}, {1, 1}, {2, 3}, {0, 3}};
    const float blooms[4] = {1.0f, 1.0f, 1.0f, 0.35f};
    for (int c = 0; c < 4; ++c) {
      wet(device);
      device.set_param(p::kBloom, blooms[c]);
      device.set_param(p::kDecay, 30.0f);
      device.set_param(p::kDirection, static_cast<float>(combos[c][0]));
      device.set_param(p::kInterval, static_cast<float>(combos[c][1]));
      rng_state() = 0x4242u;
      std::vector<float> input = noise(3.0f, kRate, 0.5f);
      std::vector<float> tone = sine(500.0f, 3.0f, kRate, 0.5f);
      for (size_t i = 0; i < input.size(); ++i) input[i] += tone[i];
      Stereo loud = run(device, input);
      Stereo early = render(device, 30.0f, kRate);
      Stereo rest = render(device, 60.0f, kRate);
      Stereo after = render(device, 0.5f, kRate);
      char label[120];
      std::snprintf(label, sizeof label, "extreme %d: full-scale input at Decay 30 stays bounded (peak %g)", c,
                    std::max(peak(loud.left), peak(early.left)));
      EXPECT(finite(loud.left) && finite(early.left) && finite(rest.left) && peak(loud.left) < 0.5 &&
                 peak(loud.right) < 0.5 && peak(early.left) < 0.5 && peak(early.right) < 0.5,
             label);
      EXPECT(rms(early.left, at(20.0f)) < 0.05 * rms(early.left, 0, at(10.0f)),
             "extreme: the tail is decaying, not sustaining itself");
      std::snprintf(label, sizeof label, "extreme %d: the 30 s tail reaches exact silence", c);
      EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, label);
    }
  }

  // 96 kHz is the same instrument as 48 kHz: the core runs at half rate, so
  // the decay, the interval grid and the tone are those of 48 kHz.
  {
    const double low = noise_rt60(4.0f, 0.0f, 48000.0f);
    const double high = noise_rt60(4.0f, 0.0f, 96000.0f);
    EXPECT_NEAR(high, low, 0.4, "96 kHz decays as long as 48 kHz");
    const std::vector<float> fifth = held_at_full_age(0, 0, 96000.0f);
    EXPECT_NEAR(dominant_frequency(fifth, 96000.0, 100.0, 4000.0), 750.0, 3.0, "96 kHz: the same fifth");
    const std::vector<float> reference = held_at_full_age(0, 0, 48000.0f);
    EXPECT_NEAR(rms(fifth), rms(reference), 0.1 * rms(reference), "96 kHz: at the same level");

    // 531.25 Hz sits on the unison grain grid of a 48 kHz drifter (31.25 Hz)
    // and exactly between the grid points of one run at 96 kHz, where the
    // grains would cancel it.
    double level[2];
    const float rates[2] = {48000.0f, 96000.0f};
    for (int r = 0; r < 2; ++r) {
      wet(device, rates[r]);
      device.set_param(p::kBloom, 0.0f);
      Stereo held = run(device, sine(531.25f, 3.0f, rates[r], 0.25f));
      level[r] = rms(held.left, at(2.0f, rates[r]));
    }
    EXPECT(level[0] > 0.05, "a held tone on the grain grid comes back strongly");
    EXPECT_NEAR(level[1], level[0], 0.05 * level[0], "96 kHz: the grains are as long as at 48 kHz");

    // The half-rate core keeps its place across blocks of any length.
    device.init(96000.0f);
    rng_state() = 0x31u;
    std::vector<float> input = noise(0.5f, 96000.0f, 0.5f);
    Stereo whole = run(device, input);
    device.init(96000.0f);
    Stereo ragged = run(device, input, 37);
    double worst = 0.0;
    for (size_t i = 0; i < input.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(whole.left[i]) - ragged.left[i]));
    }
    EXPECT(worst < 1.0e-6, "96 kHz: output does not depend on block size");
  }

  // Moving Mix, Bloom and Width while a note sounds does not click.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.2f);
    device.set_param(p::kBloom, 0.2f);
    std::vector<float> tone = sine(220.0f, 1.0f, kRate, 0.25f);
    Stereo before = run(device, tone);
    const double steady = max_step(before.left, at(0.5f));
    device.set_param(p::kMix, 0.9f);
    device.set_param(p::kBloom, 0.9f);
    device.set_param(p::kWidth, 0.1f);
    // Continue the sine in phase.
    std::vector<float> next(tone.size());
    for (size_t i = 0; i < next.size(); ++i) {
      next[i] = 0.25f * static_cast<float>(std::sin(2.0 * kPi * 220.0 * static_cast<double>(i + tone.size()) / kRate));
    }
    Stereo moved = run(device, next);
    EXPECT(max_step(moved.left, 0, at(0.1f)) < 2.0 * steady && max_step(moved.right, 0, at(0.1f)) < 2.0 * steady,
           "Mix, Bloom and Width changes ramp without a click");
  }

  // The device sleeps: exact zero after the tail, and it wakes on new input.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 16.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, noise(0.5f, kRate, 0.5f));
    EXPECT(rms(woken.left, at(0.3f)) > 0.01, "wakes on new input");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("bloom-reverb", 10.0f, kRate, [&] { run(device, input); });

  return finish("bloom-reverb");
}
