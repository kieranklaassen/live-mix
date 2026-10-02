// Native harness for Vowel Reverb (cpp/devices/vowel-reverb). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a reverb that sings: a
// tail with the formants of the chosen vowel, which decays slowest on them.

#include "../devices/vowel-reverb/vowel_reverb.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::VowelReverb;
namespace p = livemix::vowel_reverb;
namespace vd = livemix::vowel_dsp;

static VowelReverb device;

static const float kRate = 48000.0f;

// Welch power spectrum: 8192-point Hann segments, half overlapped, summed
// over every add(); db() reads it averaged over a fraction of an octave. A
// reverb tail is a few fixed modes per hertz, each with its own level, so one
// burst read bin by bin is as rough as its input: the checks below add
// several bursts and both sides, and smooth over a twelfth of an octave.
struct Welch {
  static constexpr int kN = 8192;
  std::vector<double> power = std::vector<double>(kN / 2, 0.0);
  int segments = 0;

  void add(const std::vector<float>& x, size_t from, size_t to, float rate = kRate) {
    static livemix::kit::Fft<kN> fft;
    static bool ready = false;
    static float re[kN], im[kN];
    if (!ready) {
      fft.init();
      ready = true;
    }
    bin = rate / kN;
    for (size_t s = from; s + kN <= to && s + kN <= x.size(); s += kN / 2) {
      for (int i = 0; i < kN; ++i) {
        re[i] = x[s + i] * static_cast<float>(0.5 - 0.5 * std::cos(2.0 * kPi * i / kN));
        im[i] = 0.0f;
      }
      fft.forward(re, im);
      for (int i = 0; i < kN / 2; ++i) power[i] += static_cast<double>(re[i]) * re[i] + static_cast<double>(im[i]) * im[i];
      ++segments;
    }
  }

  double db(double hz, double octaves = 1.0 / 12.0) const {
    int lo = static_cast<int>(std::floor(hz * std::pow(2.0, -0.5 * octaves) / bin));
    int hi = static_cast<int>(std::ceil(hz * std::pow(2.0, 0.5 * octaves) / bin));
    lo = std::max(lo, 1);
    hi = std::min(hi, kN / 2 - 1);
    double sum = 0.0;
    for (int i = lo; i <= hi; ++i) sum += power[i];
    return 10.0 * std::log10(std::max(sum / (hi - lo + 1) / std::max(segments, 1), 1.0e-30));
  }

  // The frequency of the highest point in [lo, hi] Hz, on a 1 % grid.
  double peak_hz(double lo, double hi, double* level = nullptr) const {
    double best = -1.0e9, at = lo;
    for (double hz = lo; hz <= hi; hz *= 1.01) {
      const double value = db(hz);
      if (value > best) {
        best = value;
        at = hz;
      }
    }
    if (level) *level = best;
    return at;
  }

  double lowest_db(double lo, double hi) const {
    double low = 1.0e9;
    for (double hz = lo; hz <= hi; hz *= 1.01) low = std::min(low, db(hz));
    return low;
  }

  double bin = kRate / kN;
};

// Wet only, no drift of the vowel: the reverb as set.
static void still(VowelReverb& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kMotion, 0.0f);
  d.set_param(p::kPreDelay, 0.0f);
}

// `seconds` of noise, then silence up to `total`.
static std::vector<float> burst(float seconds, float total, float gain = 0.5f, float rate = kRate) {
  std::vector<float> x = noise(seconds, rate, gain);
  x.resize(static_cast<size_t>(total * rate), 0.0f);
  return x;
}

// The tail spectrum (0.5 s to `seconds`) of noise bursts through `device`
// as `setup` leaves it, over three bursts and both sides.
template <typename Setup>
static Welch tail_spectrum(Setup setup, float seconds = 4.5f, float rate = kRate) {
  Welch spectrum;
  for (uint32_t seed : {0x5EEDu, 77u, 4242u}) {
    setup();
    rng_state() = seed;
    Stereo out = run(device, burst(0.3f, seconds, 0.5f, rate));
    const size_t from = static_cast<size_t>(0.5f * rate);
    spectrum.add(out.left, from, out.size(), rate);
    spectrum.add(out.right, from, out.size(), rate);
  }
  return spectrum;
}

// One band of a signal: two band-passes in series, about a third of an octave.
static std::vector<float> band(const std::vector<float>& x, double hz) {
  livemix::kit::Svf a, b;
  a.set(static_cast<float>(hz), 4.0f, kRate);
  b.set(static_cast<float>(hz), 4.0f, kRate);
  std::vector<float> y(x.size());
  for (size_t i = 0; i < x.size(); ++i) y[i] = b.bandpass(a.bandpass(x[i]));
  return y;
}

// A held chord with fifteen harmonics a note: something with energy on every
// formant, and a waveform with large steps of its own.
static std::vector<float> chord(float seconds, float gain = 0.12f) {
  const double notes[4] = {110.0, 164.81, 220.0, 277.18};
  std::vector<float> x(static_cast<size_t>(seconds * kRate));
  for (size_t i = 0; i < x.size(); ++i) {
    double v = 0.0;
    for (int n = 0; n < 4; ++n) {
      for (int h = 1; h <= 15; ++h) v += std::sin(2.0 * kPi * notes[n] * h * i / kRate + 1.3 * h + n) / h;
    }
    const double fade = std::min(1.0, std::min(i, x.size() - 1 - i) / (0.05 * kRate));
    x[i] = static_cast<float>(gain * v * fade);
  }
  return x;
}

int main() {
  Conformance spec;
  spec.name = "vowel-reverb";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 18.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  char label[200];

  // Mix 0 is the dry signal untouched, bit for bit.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> x = chord(1.0f);
    Stereo out = run(device, x);
    EXPECT(out.left == x && out.right == x, "Mix 0 passes the input through exactly");
  }

  // The tail sings the vowel: with Resonance 1 the tail of a noise burst has
  // its two strongest low peaks on the table's first two formants, for all
  // five vowels (tenor voice, a third of the way up Voice).
  {
    const char* names[5] = {"A", "E", "I", "O", "U"};
    for (int vowel = 0; vowel < 5; ++vowel) {
      const vd::Formants& table = vd::kTable[1][vowel];
      Welch spectrum = tail_spectrum([&] {
        still(device);
        device.set_param(p::kResonance, 1.0f);
        device.set_param(p::kVoice, 1.0f / 3.0f);
        device.set_param(p::kVowel, static_cast<float>(vowel));
      });
      // The highest point within 15 % of each formant: a slope with no peak
      // on it would read at one end of that range, outside the 8 %.
      const double f1 = spectrum.peak_hz(table.hz[0] / 1.15, table.hz[0] * 1.15);
      const double f2 = spectrum.peak_hz(table.hz[1] / 1.15, table.hz[1] * 1.15);
      std::snprintf(label, sizeof label, "vowel %s: first formant at %.0f Hz (table %.0f Hz, within 8 %%)",
                    names[vowel], f1, table.hz[0]);
      EXPECT(std::fabs(f1 / table.hz[0] - 1.0) < 0.08, label);
      std::snprintf(label, sizeof label, "vowel %s: second formant at %.0f Hz (table %.0f Hz, within 8 %%)",
                    names[vowel], f2, table.hz[1]);
      EXPECT(std::fabs(f2 / table.hz[1] - 1.0) < 0.08, label);
      std::printf("  vowel %s: F1 %.0f Hz (table %.0f), F2 %.0f Hz (table %.0f)\n", names[vowel], f1,
                  table.hz[0], f2, table.hz[1]);
    }
  }

  // Resonance is how much vowel: at 0 the tail is a plain hall with no
  // formant peaks, at 1 the peaks stand far above the valleys.
  {
    double range[3];
    const float settings[3] = {0.0f, 0.6f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      Welch spectrum = tail_spectrum([&] {
        still(device);
        device.set_param(p::kResonance, settings[k]);
      });
      double top;
      spectrum.peak_hz(300.0, 3000.0, &top);
      range[k] = top - spectrum.lowest_db(300.0, 3000.0);
    }
    std::printf("  peak to valley, 300 Hz to 3 kHz: Resonance 0 %.1f dB, 0.6 %.1f dB, 1 %.1f dB\n", range[0],
                range[1], range[2]);
    EXPECT(range[0] < 6.0, "Resonance 0: no formant peaks (under 6 dB from peak to valley)");
    EXPECT(range[1] > range[0] + 6.0 && range[2] > range[1], "Resonance deepens the vowel all the way up");
    EXPECT(range[2] > 12.0, "Resonance 1: formant peaks more than 12 dB above the valleys");
  }

  // The vowel in the loop can never add: its gain is at most 1 at every
  // frequency, for every vowel and voice, and close to 1 on the first
  // formant (so that one decays in the Decay time).
  {
    static vd::LoopBank<4> bank;
    double highest = 0.0, lowest_first = 1.0;
    for (int voice = 0; voice <= 12; ++voice) {
      for (int vowel = 0; vowel <= 40; ++vowel) {
        vd::Formants formants;
        vd::formants_at(vowel * 0.1f, voice / 12.0f, &formants);
        bank.reset();
        bank.set(formants, kRate, 32);
        double first = 0.0;
        for (double hz = 40.0; hz < 20000.0; hz *= 1.003) {
          const double gain = bank.magnitude(static_cast<float>(hz), kRate);
          highest = std::max(highest, gain);
          if (hz > formants.hz[0] * 0.9 && hz < formants.hz[0] * 1.1) first = std::max(first, gain);
        }
        lowest_first = std::min(lowest_first, first);
      }
    }
    std::printf("  loop vowel: highest gain %.4f, first formant never under %.4f\n", highest, lowest_first);
    EXPECT(highest <= 1.0, "the vowel in the loop never has a gain above 1");
    EXPECT(lowest_first > 0.97, "the vowel in the loop passes its first formant at close to 1");
  }

  // Decay is the decay time on the first formant, also with the vowel full
  // up; the valley between the formants dies sooner.
  {
    const float decays[3] = {2.0f, 6.0f, 20.0f};
    const vd::Formants& ee = vd::kTable[1][2];  // tenor I: 290 Hz and 1870 Hz, far apart
    const double valley = std::sqrt(static_cast<double>(ee.hz[0]) * ee.hz[1]);
    for (int k = 0; k < 3; ++k) {
      still(device);
      device.set_param(p::kResonance, 1.0f);
      device.set_param(p::kVoice, 1.0f / 3.0f);
      device.set_param(p::kVowel, 2.0f);
      device.set_param(p::kDecay, decays[k]);
      rng_state() = 0x5EEDu;
      Stereo out = run(device, burst(0.2f, decays[k] * 1.2f + 1.5f));
      const double on_formant = rt60(band(out.left, ee.hz[0]), kRate, 0.5, 0.1, -100.0);
      const double between = rt60(band(out.left, valley), kRate, 0.5, 0.1, -100.0);
      std::printf("  Decay %g s: RT60 %.2f s on the first formant, %.2f s in the valley\n", decays[k], on_formant,
                  between);
      std::snprintf(label, sizeof label, "Decay %g s gives that RT60 on the first formant (within 20 %%)", decays[k]);
      EXPECT_NEAR(on_formant, decays[k], 0.2 * decays[k], label);
      EXPECT(between < 0.7 * on_formant, "the valley between the formants decays sooner than the formants");
    }
    // With Resonance 0 the same two bands decay together.
    still(device);
    device.set_param(p::kResonance, 0.0f);
    rng_state() = 0x5EEDu;
    Stereo flat = run(device, burst(0.2f, 8.0f));
    const double low = rt60(band(flat.left, ee.hz[0]), kRate, 0.5, 0.1, -100.0);
    const double mid = rt60(band(flat.left, valley), kRate, 0.5, 0.1, -100.0);
    std::printf("  Resonance 0, Decay 6 s: RT60 %.2f s at %.0f Hz, %.2f s at %.0f Hz\n", low, ee.hz[0], mid, valley);
    EXPECT_NEAR(low, 6.0, 0.9, "Resonance 0: a plain hall with the Decay time");
    EXPECT_NEAR(mid / low, 1.0, 0.15, "Resonance 0: no band decays faster than another in the middle");
  }

  // The vowel gets clearer the longer the tail rings.
  {
    Welch early, late;
    for (uint32_t seed : {0x5EEDu, 77u, 4242u}) {
      still(device);
      device.set_param(p::kVowel, 2.0f);
      rng_state() = seed;
      Stereo out = run(device, burst(0.3f, 5.0f));
      early.add(out.left, 4800, 52800);
      late.add(out.left, 144000, 240000);
    }
    double early_top, late_top;
    early.peak_hz(250.0, 2500.0, &early_top);
    late.peak_hz(250.0, 2500.0, &late_top);
    const double early_range = early_top - early.lowest_db(250.0, 2500.0);
    const double late_range = late_top - late.lowest_db(250.0, 2500.0);
    std::printf("  default Resonance: peak to valley %.1f dB in the first second, %.1f dB after three\n", early_range,
                late_range);
    EXPECT(late_range > early_range + 4.0, "the vowel is clearer late in the tail than at its start");
  }

  // Voice is the size of the singers: the first formant of A rises from
  // bass (600 Hz) to soprano (800 Hz).
  {
    double f1[2];
    for (int k = 0; k < 2; ++k) {
      Welch spectrum = tail_spectrum([&] {
        still(device);
        device.set_param(p::kResonance, 1.0f);
        device.set_param(p::kVoice, static_cast<float>(k));
      });
      f1[k] = spectrum.peak_hz(400.0, 950.0);
    }
    std::printf("  first formant of A: bass %.0f Hz, soprano %.0f Hz\n", f1[0], f1[1]);
    EXPECT_NEAR(f1[0], 600.0, 48.0, "Voice 0 is the bass table");
    EXPECT_NEAR(f1[1], 800.0, 64.0, "Voice 1 is the soprano table");
  }

  // Motion lets the vowel wander: under steady noise the second formant of
  // E (1700 Hz) stays put without it and travels with it.
  {
    double span[2];
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kResonance, 1.0f);
      device.set_param(p::kVoice, 1.0f / 3.0f);
      device.set_param(p::kVowel, 1.0f);
      device.set_param(p::kDecay, 0.5f);
      device.set_param(p::kMotion, static_cast<float>(k));
      rng_state() = 0xFACEu;
      Stereo out = run(device, noise(21.0f, kRate, 0.3f));
      double lowest = 1.0e9, highest = 0.0;
      for (int second = 1; second < 21; ++second) {
        Welch spectrum;
        spectrum.add(out.left, static_cast<size_t>(second) * 48000, static_cast<size_t>(second + 1) * 48000);
        const double f2 = spectrum.peak_hz(1000.0, 2300.0);
        lowest = std::min(lowest, f2);
        highest = std::max(highest, f2);
      }
      span[k] = highest / lowest;
      std::printf("  Motion %d: second formant between %.0f and %.0f Hz over 20 s\n", k, lowest, highest);
    }
    EXPECT(span[0] < 1.06, "without Motion the vowel holds still");
    EXPECT(span[1] > 1.25, "Motion moves the vowel over time");
  }

  // The same vowel at every sample rate: the first formant of A at 44.1 and
  // 96 kHz is where it is at 48 kHz.
  for (float rate : {44100.0f, 96000.0f}) {
    Welch spectrum = tail_spectrum(
        [&] {
          still(device, rate);
          device.set_param(p::kResonance, 1.0f);
          device.set_param(p::kVoice, 1.0f / 3.0f);
        },
        3.0f, rate);
    const double f1 = spectrum.peak_hz(400.0, 950.0);
    std::snprintf(label, sizeof label, "at %.0f Hz the first formant of A is at %.0f Hz (650 Hz)", rate, f1);
    EXPECT_NEAR(f1, 650.0, 52.0, label);
  }
  device.init(kRate);

  // Sweeping the vowel (and the other vowel controls) while a chord rings
  // neither clicks nor zippers: no step larger than the chord's own, and
  // nothing new at the control rate (1500 Hz) under a pure low tone.
  {
    std::vector<float> x = chord(4.0f);
    const auto sweep = [&](const std::vector<float>& input, int moves) {
      still(device);
      device.set_param(p::kResonance, 1.0f);
      Stereo out;
      out.left.resize(input.size());
      out.right.resize(input.size());
      for (size_t done = 0; done < input.size(); done += 128) {
        const float t = static_cast<float>(done) / input.size();
        if (moves >= 1 && done >= 48000) device.set_param(p::kVowel, 4.0f * (0.5f - 0.5f * std::cos(12.0f * t)));
        if (moves >= 2 && done == 96000) {
          device.set_param(p::kVowel, 4.0f);  // a jump on top of the sweep
          device.set_param(p::kVoice, 1.0f);
          device.set_param(p::kMotion, 1.0f);
          device.set_param(p::kResonance, 0.5f);
        }
        for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
        device.process(128);
        for (int i = 0; i < 128; ++i) {
          out.left[done + i] = device.out_left()[i];
          out.right[done + i] = device.out_right()[i];
        }
      }
      return out;
    };
    const double before = std::max(max_step(sweep(x, 0).left), max_step(sweep(x, 0).right));
    Stereo swept = sweep(x, 1);
    Stereo jumped = sweep(x, 2);
    const double swept_step = std::max(max_step(swept.left), max_step(swept.right));
    const double jumped_step = std::max(max_step(jumped.left), max_step(jumped.right));
    std::printf("  largest step: still %.4f, vowel swept %.4f, vowel, voice, motion and resonance jumped %.4f\n",
                before, swept_step, jumped_step);
    EXPECT(swept_step < before * 1.3 + 0.002, "sweeping Vowel while the tail rings does not click");
    EXPECT(jumped_step < before * 1.3 + 0.002, "jumping Vowel, Voice, Motion and Resonance does not click");
    std::vector<float> tone = sine(330.0f, 4.0f, kRate, 0.4f);
    Stereo zip = sweep(tone, 1);
    double zipper = 0.0;
    for (double hz : {1500.0, 3000.0, 4500.0}) {
      for (double offset : {-330.0, 0.0, 330.0}) {
        zipper = std::max(zipper, tone_level(zip.left, hz + offset, kRate, 48000, zip.size()));
      }
    }
    std::printf("  control-rate products under a swept vowel: %.1f dB against a tone at %.1f dB\n", db(zipper),
                db(tone_level(zip.left, 330.0, kRate, 48000, zip.size())));
    EXPECT(db(zipper) < -90.0, "sweeping Vowel leaves no zipper at the control rate");
  }

  // The worst case stays bounded and still decays: everything up, loud input.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kDecay, 40.0f);
    device.set_param(p::kResonance, 1.0f);
    device.set_param(p::kSize, 1.0f);
    device.set_param(p::kMotion, 1.0f);
    device.set_param(p::kHighCut, 18000.0f);
    rng_state() = 0xFEEDu;
    Stereo loud = run(device, noise(10.0f, kRate, 1.0f));
    Stereo more = run(device, sine(650.0f, 10.0f, kRate, 1.0f));  // on the first formant
    Stereo tail = render(device, 20.0f, kRate);
    const double worst = std::max(std::max(peak(loud.left), peak(loud.right)),
                                  std::max(std::max(peak(more.left), peak(more.right)), peak(tail.left)));
    std::printf("  full-scale noise then a full-scale tone on the formant at maximum Decay, Resonance and Size: peak %.2f\n",
                worst);
    EXPECT(finite(loud.left) && finite(more.left) && finite(tail.left), "maximum Decay, Resonance and Size stay finite");
    EXPECT(worst <= 2.0, "maximum Decay, Resonance and Size stay bounded (the wet signal lands on 2)");
    const size_t n = tail.left.size();
    EXPECT(rms(tail.left, n - 96000, n) < 0.5 * rms(tail.left, 0, 96000), "and still decay once the input stops");
  }

  // Stereo: the two sides of the tail are decorrelated at Width 1 and
  // identical at Width 0; the bass of the tail stays in the middle; and the
  // default patch folds to mono without losing level.
  {
    still(device);
    device.set_param(p::kLowCut, 20.0f);
    rng_state() = 0xABCDu;
    std::vector<float> x = noise(4.0f, kRate, 0.3f);
    Stereo wide = run(device, x);
    const double wide_corr = correlation(wide.left, wide.right, 24000);
    const double bass_corr = correlation(band(wide.left, 50.0), band(wide.right, 50.0), 48000);
    const double mid_corr = correlation(band(wide.left, 1000.0), band(wide.right, 1000.0), 48000);
    std::printf("  wet only: left/right correlation %.2f overall, %.2f at 50 Hz, %.2f at 1 kHz\n", wide_corr, bass_corr,
                mid_corr);
    EXPECT(std::fabs(wide_corr) < 0.3, "Width 1: the two sides of the tail are decorrelated");
    EXPECT(bass_corr > 0.8, "the bass of the tail stays in the middle");
    still(device);
    device.set_param(p::kWidth, 0.0f);
    rng_state() = 0xABCDu;
    Stereo mono = run(device, x);
    EXPECT(rms(mono.left) > 0.01 && mono.left == mono.right, "Width 0 is a mono tail");

    device.init(kRate);
    std::vector<float> held = chord(6.0f);
    Stereo out = run(device, held);
    std::vector<float> sum(out.size());
    for (size_t i = 0; i < sum.size(); ++i) sum[i] = 0.5f * (out.left[i] + out.right[i]);
    const size_t from = 2 * 48000, to = 5 * 48000;
    const double level = db(rms(out.left, from, to)) - db(rms(held, from, to));
    const double folded = db(rms(sum, from, to)) - db(rms(out.left, from, to));
    std::printf("  default patch on a held chord: %+.1f dB against dry, correlation %.2f, %+.1f dB when summed to mono\n",
                level, correlation(out.left, out.right, from, to), folded);
    EXPECT(std::fabs(level) < 3.0, "the default patch is within 3 dB of the dry level on a held chord");
    EXPECT(correlation(out.left, out.right, from, to) > 0.0, "the default patch is positively correlated on a mono source");
    EXPECT(folded > -3.0, "the default patch loses less than 3 dB when summed to mono");
    EXPECT(std::fabs(mean(out.left, from, to)) < 1.0e-3, "no DC in the output");
  }

  // Pre-delay holds the whole wet signal back by its setting.
  {
    still(device);
    device.set_param(p::kPreDelay, 150.0f);
    Stereo out = run(device, impulse(0.5f, kRate, 0.5f));
    EXPECT(peak(out.left, 0, 7190) < 1.0e-6, "nothing before the pre-delay has passed");
    EXPECT(peak(out.left, 7200, 7400) > 0.003, "the reverb starts at the pre-delay");
    still(device);
    Stereo direct = run(device, impulse(0.1f, kRate, 0.5f));
    EXPECT(peak(direct.left, 0, 200) > 0.003, "with no pre-delay the reverb starts at once");
  }

  // High Cut darkens the tail and Low Cut thins it.
  {
    double bright = 0.0, dark = 0.0, full = 0.0, thin = 0.0;
    for (int pass = 0; pass < 2; ++pass) {
      still(device);
      device.set_param(p::kResonance, 0.0f);
      device.set_param(p::kHighCut, pass == 0 ? 18000.0f : 1500.0f);
      rng_state() = 0xC0FFEEu;
      Stereo out = run(device, burst(0.2f, 2.0f));
      (pass == 0 ? bright : dark) = energy_above(out.left, 4000.0, kRate, 48000, 96000);
      still(device);
      device.set_param(p::kResonance, 0.0f);
      device.set_param(p::kLowCut, pass == 0 ? 20.0f : 800.0f);
      Stereo low = run(device, sine(110.0f, 2.0f, kRate, 0.25f));
      (pass == 0 ? full : thin) = tone_level(low.left, 110.0, kRate, 48000, 96000);
    }
    std::printf("  share of the tail above 4 kHz: %.3f with High Cut open, %.4f at 1.5 kHz; 110 Hz: %.1f dB with Low Cut at 800 Hz\n",
                bright, dark, db(thin / full));
    EXPECT(bright > 0.05 && dark < 0.15 * bright, "High Cut darkens the tail");
    EXPECT(full > 0.01 && thin < 0.05 * full, "Low Cut takes the bass out of the tail");
  }

  // Modulation moves the lines: a held tone is spread away from its line.
  {
    double share[2];
    for (int pass = 0; pass < 2; ++pass) {
      still(device);
      device.set_param(p::kResonance, 0.0f);
      device.set_param(p::kModulation, pass == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, sine(1000.0f, 6.0f, kRate, 0.25f));
      const size_t a = 2 * 48000, b = 6 * 48000;
      share[pass] = tone_level(out.left, 1000.0, kRate, a, b) / (std::sqrt(2.0) * rms(out.left, a, b));
    }
    std::printf("  share of a held 1 kHz tone left on its line: %.2f without Modulation, %.2f with\n", share[0], share[1]);
    EXPECT(share[0] > 0.98, "without Modulation a held tone stays one line");
    EXPECT(share[1] < 0.8, "Modulation spreads a held tone into an ensemble");
  }

  // The device sleeps: after the tail it does no work and returns exact zero.
  {
    device.init(kRate);
    device.set_param(p::kDecay, 2.0f);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 8.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, impulse(1.0f, kRate, 0.5f));
    EXPECT(peak(woken.left, 2000, 20000) > 0.001, "wakes on new input");
  }

  // Cost at the heaviest setting: the vowel full up in the loop and moving
  // (so every filter is retuned all the time), under continuous input.
  device.init(kRate);
  device.set_param(p::kResonance, 1.0f);
  device.set_param(p::kMotion, 1.0f);
  device.set_param(p::kModulation, 1.0f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("vowel-reverb", 10.0f, kRate, [&] { run(device, input); });

  return finish("vowel-reverb");
}
