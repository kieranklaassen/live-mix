// Native harness for Glass (cpp/devices/fm-glass). The conformance pass
// covers silence, determinism, voice stealing and parameter abuse; the rest
// measures what makes it an FM instrument: where the sidebands sit, how many
// there are (the modulation index, read back from the spectrum), how that
// index moves with Brightness, Decay, velocity and pitch, and that nothing
// folds back at the top of the keyboard.

#include "../devices/fm-glass/fm_glass.h"
#include "support/test_kit.h"

#include <complex>

using namespace testkit;
using livemix::FmGlass;
namespace p = livemix::fm_glass;

static FmGlass device;

static const float kRate = 48000.0f;

// Indices into the Ratio list.
enum RatioChoice { kHalf = 0, kOne, k141, kTwo, k276, kThree, k35, kFour, kFive, kSeven, kNine, k14 };

// One clean operator pair: Bell, no detune or feedback, velocity off, the
// slowest decay, and Spread 1 so the left channel is pair A alone.
static void pair(FmGlass& d, int ratio, float brightness) {
  d.init(kRate);
  d.set_param(p::kAlgorithm, FmGlass::kBell);
  d.set_param(p::kRatio, static_cast<float>(ratio));
  d.set_param(p::kBrightness, brightness);
  d.set_param(p::kDecay, 20.0f);
  d.set_param(p::kAttack, 0.001f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kSustain, 0.0f);
  d.set_param(p::kDetune, 0.0f);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kVelocity, 0.0f);
  d.set_param(p::kSpread, 1.0f);
  d.set_param(p::kVolume, 0.0f);
}

// The index (radians) that `pair` should show `seconds` into a full-velocity
// note: Brightness^1.5 of the maximum, scaled by the key, less what the
// 20 s Decay (60 dB in its key-scaled time) has taken off by then.
static double pair_index(double brightness, float hz, double seconds, double decay_scale = 1.0) {
  const double fallen = std::pow(10.0, -3.0 * seconds / (20.0 * FmGlass::key_time_scale(hz) * decay_scale));
  return FmGlass::kMaxIndex * std::pow(brightness, 1.5) * FmGlass::key_index_scale(hz) * fallen;
}

// Share of a pair's energy in sidebands of order `least` and above.
static double high_order_share(const std::vector<float>& x, double carrier, double ratio, size_t from,
                               size_t to, int least, int orders = 14) {
  double high = 0.0, total = 0.0;
  for (int n = -orders; n <= orders; ++n) {
    const double hz = std::fabs(carrier * (1.0 + ratio * n));
    if (hz > 0.45 * kRate) continue;
    const double level = tone_level(x, hz, kRate, from, to);
    total += level * level;
    if (std::abs(n) >= least) high += level * level;
  }
  return total > 0.0 ? high / total : 0.0;
}

// Power spectrum (Hann) of n samples from `from`; n is a power of two.
static std::vector<double> power_spectrum(const std::vector<float>& x, size_t from, size_t n) {
  std::vector<std::complex<double>> a(n);
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    a[i] = from + i < x.size() ? w * x[from + i] : 0.0;
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> step = std::polar(1.0, -2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w = 1.0;
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= step;
      }
    }
  }
  std::vector<double> power(n / 2);
  for (size_t i = 0; i < n / 2; ++i) power[i] = std::norm(a[i]);
  return power;
}

// Share of the power in [lo, hi) Hz.
static double band_share(const std::vector<double>& power, double lo, double hi) {
  const double bin = kRate / (2.0 * static_cast<double>(power.size()));
  double inside = 0.0, total = 0.0;
  for (size_t i = 0; i < power.size(); ++i) {
    const double hz = static_cast<double>(i) * bin;
    total += power[i];
    if (hz >= lo && hz < hi) inside += power[i];
  }
  return total > 0.0 ? inside / total : 0.0;
}

// The modulation index of a single carrier/modulator pair, read back from
// its spectrum: the sideband of order n has amplitude J_n(I), and
// sum(n² J_n²) = I²/2, so I = sqrt(2 · sum(n² P_n) / sum(P_n)). The ratio
// must put every order on its own frequency (3.5 does: 1, 2.5, 4.5, 6, 8 ...).
static double measured_index(const std::vector<float>& x, double carrier, double ratio, size_t from,
                             size_t to, int orders = 14) {
  double weighted = 0.0, total = 0.0;
  for (int n = -orders; n <= orders; ++n) {
    const double hz = std::fabs(carrier * (1.0 + ratio * n));
    if (hz > 0.45 * kRate) continue;
    const double level = tone_level(x, hz, kRate, from, to);
    weighted += static_cast<double>(n) * n * level * level;
    total += level * level;
  }
  return total > 0.0 ? std::sqrt(2.0 * weighted / total) : 0.0;
}

// Beat rate: the strongest frequency in the squared-level envelope.
static double beat_rate(const std::vector<float>& x, size_t from, size_t hop) {
  std::vector<float> envelope;
  double sum = 0.0;
  for (size_t at = from; at + hop <= x.size(); at += hop) {
    const double level = rms(x, at, at + hop);
    envelope.push_back(static_cast<float>(level * level));
    sum += level * level;
  }
  const float centre = static_cast<float>(sum / static_cast<double>(envelope.size()));
  for (float& v : envelope) v -= centre;
  return dominant_frequency(envelope, kRate / static_cast<double>(hop), 0.3, 12.0);
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

int main() {
  Conformance spec;
  spec.name = "fm-glass";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.5f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // The carrier is the pitch, in every register, whatever the brightness.
  for (float hz : {55.0f, 220.0f, 440.0f, 1760.0f, 3520.0f}) {
    for (float brightness : {0.0f, 0.3f}) {
      pair(device, k35, brightness);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, 1.5f, kRate);
      const double found = dominant_frequency(out.left, kRate, hz * 0.8, hz * 1.25, 12000);
      char label[96];
      std::snprintf(label, sizeof label, "carrier at %.0f Hz, brightness %.1f: %.2f cents off", hz,
                    brightness, cents(found, hz));
      EXPECT(std::fabs(cents(found, hz)) < 3.0, label);
    }
  }

  // Sidebands sit at carrier ± n × modulator, with Bessel-function levels.
  {
    const double fc = 400.0, ratio = 3.5;
    pair(device, k35, 0.4f);
    device.note_on(1, 400.0f, 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    const double index = pair_index(0.4, 400.0f, 0.2);
    const double carrier = tone_level(out.left, fc, kRate, 4800, 14400);
    EXPECT(carrier > 1.0e-3, "the carrier sounds");
    for (int n : {-3, -2, -1, 1, 2, 3}) {
      const double hz = std::fabs(fc * (1.0 + ratio * n));
      const double level = tone_level(out.left, hz, kRate, 4800, 14400) / carrier;
      const double expected = std::fabs(std::cyl_bessel_j(std::abs(n), index) / std::cyl_bessel_j(0, index));
      char label[120];
      std::snprintf(label, sizeof label, "sideband %+d at %.0f Hz: %.3f of the carrier, J%d/J0 says %.3f",
                    n, hz, level, std::abs(n), expected);
      EXPECT(std::fabs(level - expected) < 0.06 * expected + 0.004, label);
    }
    // Nothing between them: multiples of the modulator alone, or of the carrier.
    for (double hz : {700.0, 800.0, 1200.0, 1400.0, 2100.0, 2800.0}) {
      EXPECT(tone_level(out.left, hz, kRate, 4800, 14400) < 0.002 * carrier,
             "no energy between the sidebands");
    }

    // Another ratio moves them: 2 puts the sidebands on odd harmonics.
    pair(device, kTwo, 0.4f);
    device.note_on(1, 400.0f, 1.0f);
    Stereo two = render(device, 1.0f, kRate);
    const double base = tone_level(two.left, 400.0, kRate, 12000, 36000);
    EXPECT(tone_level(two.left, 1200.0, kRate, 12000, 36000) > 0.2 * base &&
               tone_level(two.left, 2000.0, kRate, 12000, 36000) > 0.05 * base,
           "ratio 2: sidebands at 3 and 5 times the carrier");
    EXPECT(tone_level(two.left, 1000.0, kRate, 12000, 36000) < 0.002 * base &&
               tone_level(two.left, 1800.0, kRate, 12000, 36000) < 0.002 * base &&
               tone_level(two.left, 800.0, kRate, 12000, 36000) < 0.002 * base,
           "ratio 2: and nowhere ratio 3.5 put them, nor on the even harmonics");
  }

  // Brightness is the modulation index: sideband energy rises monotonically,
  // and the index read from the spectrum is the one the control asks for.
  {
    const float hz = 220.0f;
    double last_index = -1.0, last_share = -1.0;
    bool index_rises = true, share_rises = true, index_matches = true;
    for (int step = 0; step <= 10; ++step) {
      const float brightness = 0.1f * static_cast<float>(step);
      pair(device, k35, brightness);
      device.note_on(1, hz, 1.0f);
      Stereo out = render(device, 0.75f, kRate);
      const double index = measured_index(out.left, hz, 3.5, 12000, 36000);
      const double expected = pair_index(brightness, hz, 0.5);
      if (std::fabs(index - expected) > 0.03 * expected + 0.01) {
        index_matches = false;
        std::printf("  brightness %.1f: index %.3f, expected %.3f\n", brightness, index, expected);
      }
      if (index <= last_index) index_rises = false;
      last_index = index;
      // Energy outside the carrier, up to the first zero of J0 (index 2.4),
      // past which the carrier itself comes back.
      if (expected < 2.3) {
        const double carrier = tone_level(out.left, hz, kRate, 12000, 36000);
        const double total = rms(out.left, 12000, 36000);
        const double share = 1.0 - 0.5 * carrier * carrier / (total * total);
        if (share <= last_share + (step == 0 ? -1.0 : 0.0)) share_rises = false;
        last_share = share;
      }
    }
    EXPECT(index_rises, "Brightness raises the modulation index monotonically");
    EXPECT(share_rises, "Brightness raises the energy in the sidebands monotonically");
    EXPECT(index_matches, "the index in the spectrum is the one Brightness sets");
  }

  // Decay: the modulation index falls 60 dB in the set time (at the reference
  // pitch), so the spectrum darkens at that rate while the carrier rings on.
  {
    const float hz = FmGlass::kKeyReferenceHz;
    double slopes[2];
    const float decays[2] = {1.0f, 4.0f};
    for (int which = 0; which < 2; ++which) {
      pair(device, k35, 0.6f);
      device.set_param(p::kSustain, 0.0f);
      device.set_param(p::kDecay, decays[which]);
      device.note_on(1, hz, 1.0f);
      Stereo out = render(device, 2.0f, kRate);
      const double t0 = 0.1 * decays[which], t1 = 0.4 * decays[which];
      const size_t window = 2400;
      const size_t a = static_cast<size_t>(t0 * kRate), b = static_cast<size_t>(t1 * kRate);
      const double early = measured_index(out.left, hz, 3.5, a - window, a + window);
      const double late = measured_index(out.left, hz, 3.5, b - window, b + window);
      slopes[which] = 20.0 * std::log10(late / early) / (t1 - t0);
      char label[120];
      std::snprintf(label, sizeof label, "Decay %.0f s: the index falls %.1f dB/s, expected %.1f",
                    decays[which], slopes[which], -60.0 / decays[which]);
      EXPECT(std::fabs(slopes[which] + 60.0 / decays[which]) < 0.08 * 60.0 / decays[which], label);
      if (which == 0) {
        // The carriers ring kAmpDecayRatio times longer than the brightness.
        const double ring = rt60(out.left, kRate, 0.2, 0.1, -80.0);
        EXPECT_NEAR(ring, FmGlass::kAmpDecayRatio * decays[which], 0.4,
                    "the carrier decays four times slower than the brightness");
        const double start = band_share(power_spectrum(out.left, 480, 4096), 1.5 * hz, 24000.0);
        const double later = band_share(power_spectrum(out.left, 72000, 4096), 1.5 * hz, 24000.0);
        std::printf("  energy above the fundamental: %.3f at the strike, %.2g after 1.5 s\n", start, later);
        EXPECT(start > 0.5 && later < 1.0e-4, "a bright strike that has become a bare sine 1.5 s in");
      }
    }
  }

  // An inharmonic ratio gives a bell (partials off the harmonic series), an
  // integer ratio a harmonic tone.
  {
    auto harmonic_share = [&](int ratio) {
      pair(device, ratio, 0.5f);
      device.note_on(1, 400.0f, 1.0f);
      Stereo out = render(device, 1.0f, kRate);
      double harmonic = 0.0;
      for (int k = 1; k * 400 < 20000; ++k) {
        const double level = tone_level(out.left, 400.0 * k, kRate, 12000, 36000);
        harmonic += 0.5 * level * level;
      }
      const double total = rms(out.left, 12000, 36000);
      return harmonic / (total * total);
    };
    const double three = harmonic_share(kThree);
    const double two = harmonic_share(kTwo);
    const double bell = harmonic_share(k276);
    const double root_two = harmonic_share(k141);
    std::printf("  harmonic share: ratio 3 %.4f, ratio 2 %.4f, ratio 2.76 %.4f, ratio 1.41 %.4f\n", three,
                two, bell, root_two);
    EXPECT(three > 0.99 && two > 0.99, "integer ratios: all the energy is on harmonics of the note");
    EXPECT(bell < 0.5 && root_two < 0.5, "inharmonic ratios: most of the energy is off the harmonic series");
  }

  // Detune: the two groups beat at f·(2^(d/2400) − 2^(−d/2400)).
  {
    for (float detune : {10.0f, 24.0f}) {
      pair(device, k35, 0.0f);
      device.set_param(p::kSustain, 1.0f);
      device.set_param(p::kSpread, 0.0f);
      device.set_param(p::kDetune, detune);
      device.note_on(1, 440.0f, 1.0f);
      Stereo out = render(device, 8.0f, kRate);
      const double expected = 440.0 * (std::pow(2.0, detune / 2400.0) - std::pow(2.0, -detune / 2400.0));
      EXPECT_NEAR(beat_rate(out.left, 4800, 1200), expected, 0.04, "the detuned groups beat at the expected rate");
    }
    pair(device, k35, 0.0f);
    device.set_param(p::kSustain, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    device.note_on(1, 440.0f, 1.0f);
    Stereo still = render(device, 4.0f, kRate);
    double lo = 1.0e9, hi = 0.0;
    for (size_t at = 4800; at + 4800 <= still.left.size(); at += 4800) {
      const double level = rms(still.left, at, at + 4800);
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    EXPECT(hi < 1.01 * lo, "no beating without Detune");
  }

  // Spread: mono at 0; at 1 each group has its own speaker, so the beating
  // leaves the channels and becomes movement between them.
  {
    pair(device, k35, 0.3f);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kDetune, 12.0f);
    device.note_on(1, 440.0f, 1.0f);
    Stereo mono = render(device, 2.0f, kRate);
    EXPECT(mono.left == mono.right, "Spread 0 is mono");

    pair(device, k35, 0.0f);
    device.set_param(p::kSustain, 1.0f);
    device.set_param(p::kDetune, 12.0f);
    device.note_on(1, 440.0f, 1.0f);
    Stereo wide = render(device, 4.0f, kRate);
    double lo = 1.0e9, hi = 0.0;
    for (size_t at = 4800; at + 4800 <= wide.left.size(); at += 4800) {
      const double level = rms(wide.left, at, at + 4800);
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    EXPECT(hi < 1.01 * lo, "Spread 1: one group per channel, no beating inside a channel");
    const double left_hz = dominant_frequency(wide.left, kRate, 400.0, 480.0, 48000);
    const double right_hz = dominant_frequency(wide.right, kRate, 400.0, 480.0, 48000);
    EXPECT_NEAR(cents(right_hz, left_hz), 12.0, 0.5, "the right group is Detune sharp of the left");
    EXPECT_NEAR(cents(std::sqrt(left_hz * right_hz), 440.0), 0.0, 0.3, "and the pair is centred on the note");
  }

  // Velocity opens the brightness and the level; at 0 it does neither.
  {
    double index[2], level[2];
    const float gains[2] = {0.25f, 1.0f};
    for (int which = 0; which < 2; ++which) {
      pair(device, k35, 0.5f);
      device.set_param(p::kVelocity, 1.0f);
      device.note_on(1, 220.0f, gains[which]);
      Stereo out = render(device, 0.75f, kRate);
      index[which] = measured_index(out.left, 220.0, 3.5, 12000, 36000);
      level[which] = rms(out.left, 12000, 36000);
    }
    EXPECT(index[1] > 1.8 * index[0], "a hard note has about twice the modulation index of a soft one");
    EXPECT(level[1] > 3.0 * level[0], "and is much louder");
    pair(device, k35, 0.5f);
    device.note_on(1, 220.0f, 0.25f);
    Stereo soft = render(device, 0.5f, kRate);
    pair(device, k35, 0.5f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo hard = render(device, 0.5f, kRate);
    EXPECT(soft.left == hard.left, "Velocity 0: touch changes nothing");
  }

  // Feedback turns the modulator towards a sawtooth: more and higher
  // sidebands for the same Brightness, still on the same frequencies.
  {
    pair(device, k35, 0.3f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo plain = render(device, 0.75f, kRate);
    pair(device, k35, 0.3f);
    device.set_param(p::kFeedback, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo fed = render(device, 0.75f, kRate);
    const double before = measured_index(plain.left, 220.0, 3.5, 12000, 36000);
    const double after = measured_index(fed.left, 220.0, 3.5, 12000, 36000);
    std::printf("  feedback: sideband order %.3f -> %.3f\n", before, after);
    EXPECT(after > 1.15 * before, "Feedback widens the spectrum");
    const double high_before = high_order_share(plain.left, 220.0, 3.5, 12000, 36000, 3);
    const double high_after = high_order_share(fed.left, 220.0, 3.5, 12000, 36000, 3);
    std::printf("  feedback: share of energy in sidebands of order 3 and up %.4f -> %.4f\n", high_before,
                high_after);
    EXPECT(high_after > 3.0 * high_before, "by moving energy into the high-order sidebands");
    EXPECT(tone_level(fed.left, 220.0 * 3.0, kRate, 12000, 36000) <
               0.003 * tone_level(fed.left, 220.0, kRate, 12000, 36000),
           "without putting energy between the sidebands");
  }

  // Key scaling: the index falls with pitch and low notes ring longer.
  {
    double index[2];
    const float notes[2] = {130.81f, 1046.5f};
    for (int which = 0; which < 2; ++which) {
      pair(device, k35, 0.5f);
      device.note_on(1, notes[which], 1.0f);
      Stereo out = render(device, 0.75f, kRate);
      index[which] = measured_index(out.left, notes[which], 3.5, 12000, 36000, 5);
    }
    EXPECT_NEAR(index[0], pair_index(0.5, notes[0], 0.5), 0.05, "the index at 131 Hz follows the key scaling");
    EXPECT_NEAR(index[1], pair_index(0.5, notes[1], 0.5), 0.03, "and at 1047 Hz");
    EXPECT(index[0] > 2.5 * index[1], "three octaves up the index is less than half");

    double ring[2];
    const float keys[2] = {110.0f, 1760.0f};
    for (int which = 0; which < 2; ++which) {
      pair(device, k35, 0.3f);
      device.set_param(p::kSustain, 0.0f);
      device.set_param(p::kDecay, 0.4f);
      device.note_on(1, keys[which], 1.0f);
      Stereo out = render(device, 5.0f, kRate);
      ring[which] = rt60(out.left, kRate, 0.1, 0.05, -80.0);
    }
    std::printf("  ring time: %.2f s at 110 Hz, %.2f s at 1760 Hz\n", ring[0], ring[1]);
    EXPECT(ring[0] > 2.5 * ring[1], "a low note rings much longer than a high one");
    EXPECT_NEAR(ring[0], 0.4 * FmGlass::kAmpDecayRatio * FmGlass::key_time_scale(110.0f), 0.2,
                "by the key-scaling law");
  }

  // Band-limiting. With an integer ratio and no detune every true partial is
  // a harmonic of the note, so anything between the harmonics has folded back
  // from above Nyquist. Full Brightness, with and without Feedback, every
  // algorithm, notes tuned off the grid so that folded partials cannot hide
  // on a harmonic. (With the index caps removed this reads -0.3 dB.)
  {
    double worst = 0.0;
    for (int algorithm : {FmGlass::kBell, FmGlass::kGlass, FmGlass::kMallet, FmGlass::kPad}) {
      for (int ratio : {kOne, kTwo, kThree, kFive, kSeven, kNine, k14}) {
        for (float feedback : {0.0f, 1.0f}) {
          for (int step = 0; step < 14; ++step) {
            const float hz = 311.0f * std::pow(2.0f, static_cast<float>(step) * (4.5f / 14.0f));
            pair(device, ratio, 1.0f);
            device.set_param(p::kSustain, 1.0f);
            device.set_param(p::kAlgorithm, static_cast<float>(algorithm));
            device.set_param(p::kFeedback, feedback);
            device.set_param(p::kVolume, -6.0f);
            device.note_on(1, hz, 1.0f);
            Stereo out = render(device, 0.45f, kRate);
            const std::vector<double> power = power_spectrum(out.left, 4800, 16384);
            const double bin = kRate / 16384.0;
            double off = 0.0, total = 0.0;
            for (size_t i = 4; i < power.size(); ++i) {
              const double f = static_cast<double>(i) * bin;
              const double harmonic = std::round(f / hz);
              total += power[i];
              if (harmonic < 1.0 || std::fabs(f - harmonic * hz) > 16.0 * bin) off += power[i];
            }
            const double share = off / total;
            if (share > worst) worst = share;
            if (share > 4.0e-6) {
              std::printf("  algorithm %d, ratio choice %d, feedback %.0f at %.0f Hz: %.1f dB between harmonics\n",
                          algorithm, ratio, feedback, hz, 10.0 * std::log10(share));
            }
          }
        }
      }
    }
    std::printf("  worst folded energy: %.1f dB\n", 10.0 * std::log10(std::max(worst, 1e-20)));
    EXPECT(worst < 4.0e-6, "nothing folds back: under -54 dB between the harmonics at any pitch");

    // And the highest notes are not shrill: at the top the cap has taken the
    // index down to a near sine, where the same patch is bright in the middle.
    pair(device, k35, 1.0f);
    device.set_param(p::kSustain, 1.0f);
    device.note_on(1, 261.63f, 1.0f);
    Stereo middle = render(device, 0.45f, kRate);
    pair(device, k35, 1.0f);
    device.set_param(p::kSustain, 1.0f);
    device.note_on(1, 4186.0f, 1.0f);
    Stereo top = render(device, 0.45f, kRate);
    const double middle_share = band_share(power_spectrum(middle.left, 4800, 16384), 1.5 * 261.63, 24000.0);
    const double top_share = band_share(power_spectrum(top.left, 4800, 16384), 1.5 * 4186.0, 24000.0);
    std::printf("  energy above the fundamental: %.3f at middle C, %.4f four octaves up\n", middle_share,
                top_share);
    EXPECT(middle_share > 0.8 && top_share < 0.05, "the index falls away towards the top of the keyboard");
  }

  // The algorithms are wired as described.
  {
    // Bell: the second pair has 0.7 of the first pair's index.
    pair(device, k35, 0.5f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo bell = render(device, 0.75f, kRate);
    const FmGlass::Shape& bell_shape = FmGlass::kShapes[FmGlass::kBell];
    EXPECT_NEAR(measured_index(bell.left, 220.0, 3.5, 12000, 36000), pair_index(0.5, 220.0f, 0.5), 0.06,
                "Bell: the first pair has the set index");
    EXPECT_NEAR(measured_index(bell.right, 220.0, 3.5, 12000, 36000),
                bell_shape.index_b * pair_index(0.5, 220.0f, 0.5, bell_shape.mod_decay_b), 0.06,
                "Bell: the second pair is duller and its brightness dies sooner");

    // Glass: a stack on the left, a bare detuned carrier on the right.
    pair(device, k35, 0.5f);
    device.set_param(p::kAlgorithm, FmGlass::kGlass);
    device.set_param(p::kDetune, 10.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo glass = render(device, 1.5f, kRate);
    const std::vector<double> right = power_spectrum(glass.right, 4800, 32768);
    EXPECT(band_share(right, 300.0, 24000.0) < 1.0e-6, "Glass: the detuned carrier is a pure sine");
    const std::vector<double> left = power_spectrum(glass.left, 4800, 32768);
    EXPECT(band_share(left, 300.0, 24000.0) > 0.3, "Glass: the stack carries the sidebands");
    // The top operator runs at twice the modulator and modulates it, which
    // puts energy on the carrier's ±1 and ±3 sidebands that a two-operator
    // pair at this index does not have.
    const double stack = measured_index(glass.left, 220.0 * std::pow(2.0, -5.0 / 1200.0), 3.5, 12000, 36000);
    const double two_op = measured_index(bell.left, 220.0, 3.5, 12000, 36000);
    std::printf("  glass: sideband order of the stack %.3f, of a single pair %.3f\n", stack, two_op);
    EXPECT(stack > 1.15 * two_op, "Glass: the third operator widens the stack beyond a single pair");
    const double beat = cents(dominant_frequency(glass.right, kRate, 200.0, 240.0, 24000),
                              dominant_frequency(glass.left, kRate, 200.0, 240.0, 24000));
    EXPECT_NEAR(beat, 10.0, 0.5, "Glass: the bare carrier is Detune sharp of the stack");

    // Mallet: one modulator, so both carriers have the same index; and a
    // short bar partial at four times the note.
    pair(device, k35, 0.5f);
    device.set_param(p::kAlgorithm, FmGlass::kMallet);
    device.set_param(p::kSustain, 0.0f);
    device.set_param(p::kDecay, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo mallet = render(device, 2.5f, kRate);
    const double a = measured_index(mallet.left, 220.0, 3.5, 480, 2880);
    const double b = measured_index(mallet.right, 220.0, 3.5, 480, 2880);
    EXPECT(a > 0.5 && std::fabs(a / b - 1.0) < 0.02, "Mallet: one modulator drives both carriers alike");
    const double bar_early = tone_level(mallet.left, 880.0, kRate, 480, 5280) /
                             tone_level(mallet.left, 220.0, kRate, 480, 5280);
    const double bar_late = tone_level(mallet.left, 880.0, kRate, 96000, 115200) /
                            tone_level(mallet.left, 220.0, kRate, 96000, 115200);
    std::printf("  mallet bar partial: %.3f of the fundamental at the strike, %.4f after 2 s\n", bar_early,
                bar_late);
    EXPECT(bar_early > 0.1 && bar_late < 0.1 * bar_early, "Mallet: the 4x bar partial is part of the strike");

    // Pad: the brightness arrives after the level.
    pair(device, k35, 0.5f);
    device.set_param(p::kAlgorithm, FmGlass::kPad);
    device.set_param(p::kSustain, 1.0f);
    device.set_param(p::kAttack, 0.5f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo pad = render(device, 3.0f, kRate);
    const double level_ratio = rms(pad.left, 24000, 28800) / rms(pad.left, 120000, 124800);
    const double index_ratio = measured_index(pad.left, 220.0, 3.5, 21600, 31200) /
                               measured_index(pad.left, 220.0, 3.5, 115200, 124800);
    EXPECT(level_ratio > 0.95 && index_ratio < 0.85, "Pad: full level at the attack time, brightness still rising");
  }

  // Attack, Sustain and Release.
  {
    const float hz = FmGlass::kKeyReferenceHz;
    pair(device, k35, 0.0f);
    device.set_param(p::kSustain, 1.0f);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, hz, 1.0f);
    Stereo rise = render(device, 2.0f, kRate);
    const double full = rms(rise.left, 72000, 96000);
    EXPECT(rms(rise.left, 0, 4800) < 0.35 * full, "a 1 s attack is still quiet after 100 ms");
    EXPECT(rms(rise.left, 52800, 57600) > 0.9 * full, "and has arrived shortly after 1 s");
    device.note_off(1);
    Stereo fall = render(device, 3.0f, kRate);
    EXPECT(rms(fall.left, 19200, 24000) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
    EXPECT(rms(fall.left, 48000, 52800) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(peak(fall.left, 110400, 144000) == 0.0, "and is exactly silent soon after");

    // Sustain is the level the note holds at once the carriers have decayed.
    pair(device, k35, 0.0f);
    device.set_param(p::kDecay, 0.25f);  // carriers: 1 s to settle
    device.set_param(p::kSustain, 0.5f);
    device.note_on(1, hz, 1.0f);
    Stereo half = render(device, 3.0f, kRate);
    EXPECT_NEAR(rms(half.left, 120000, 144000) / peak(half.left, 0, 4800) * std::sqrt(2.0), 0.5, 0.02,
                "Sustain 0.5 holds the note at half level");

    pair(device, k35, 0.0f);
    device.set_param(p::kDecay, 0.25f);
    device.set_param(p::kSustain, 0.0f);
    device.note_on(1, hz, 1.0f);
    Stereo dies = render(device, 3.0f, kRate);
    EXPECT(peak(dies.left, 0, 4800) > 0.1 && peak(dies.left, 120000, 144000) == 0.0,
           "Sustain 0: a held bell dies away to silence on its own");

    pair(device, k35, 0.0f);
    device.set_param(p::kDecay, 0.25f);
    device.set_param(p::kSustain, 1.0f);
    device.note_on(1, hz, 1.0f);
    Stereo holds = render(device, 3.0f, kRate);
    EXPECT(rms(holds.left, 120000, 144000) > 0.99 * rms(holds.left, 4800, 28800),
           "Sustain 1: a held pad does not decay");
  }

  // Moving Brightness or Volume while a note sounds does not click.
  {
    pair(device, k35, 0.6f);
    device.set_param(p::kSustain, 1.0f);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kVolume, -6.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo steady = render(device, 0.5f, kRate);
    const double reference = max_step(steady.left, 4800);
    Stereo moving;
    for (int block = 0; block < 100; ++block) {
      device.set_param(p::kBrightness, block % 2 == 0 ? 0.1f : 0.6f);
      device.set_param(p::kVolume, block % 2 == 0 ? -18.0f : -6.0f);
      moving = concat(moving, render(device, 0.01f, kRate));
    }
    EXPECT(max_step(moving.left) < 1.5 * reference, "parameter jumps are smoothed");
  }

  // Levels: one key, and ten.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo one = render(device, 2.0f, kRate);
    const double level_db = db(std::max(peak(one.left), peak(one.right)));
    std::printf("  one key at the default volume peaks at %.1f dBFS\n", level_db);
    EXPECT(level_db > -24.0 && level_db < -10.0, "one key at the default volume peaks between -24 and -10 dBFS");

    device.init(kRate);
    device.set_param(p::kAlgorithm, FmGlass::kPad);
    device.set_param(p::kSustain, 1.0f);
    device.set_param(p::kAttack, 0.5f);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo ten = render(device, 6.0f, kRate);
    const double ten_peak = std::max(peak(ten.left), peak(ten.right));
    std::printf("  ten sustained keys peak at %.3f\n", ten_peak);
    EXPECT(ten_peak < 0.9, "ten sustained keys stay under the clip knee region");
  }

  // Cost with every voice sounding.
  device.init(kRate);
  device.set_param(p::kSustain, 1.0f);
  for (int n = 0; n < 16; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  report_cost("fm-glass (16 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("fm-glass");
}
