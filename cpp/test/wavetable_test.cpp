// Native harness for Wavetable (cpp/devices/wavetable). The conformance pass
// covers silence before and after notes, voice stealing, parameter abuse and
// other sample rates; the rest asserts what makes it a wavetable synthesizer:
// pitch, what is in the tables, how position and motion move through them,
// and that high notes do not alias.

#include "../devices/wavetable/wavetable.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::Wavetable;
namespace p = livemix::wavetable;

static Wavetable device;
static Wavetable untouched;  // only ever initialised once, to time the table build

static const float kRate = 48000.0f;

enum Table { kGlass = 0, kVowels, kReedSaw, kHollow, kSpectral };

// One still, dry voice: nothing moving, both oscillators on one pitch in the
// centre, the filter out of the way.
static void still(Wavetable& d, int table, float position) {
  d.init(kRate);
  d.set_param(p::kTable, static_cast<float>(table));
  d.set_param(p::kPosition, position);
  d.set_param(p::kMotion, 0.0f);
  d.set_param(p::kDetune, 0.0f);
  d.set_param(p::kSub, 0.0f);
  d.set_param(p::kCutoff, 20000.0f);
  d.set_param(p::kResonance, 0.0f);
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

static Stereo note(Wavetable& d, float hz, float seconds) {
  d.note_on(1, hz, 1.0f);
  return render(d, seconds, kRate);
}

// Level of harmonic `n` of `hz` over the second half-second of a render.
static double harmonic(const Stereo& out, double hz, int n) {
  return tone_level(out.left, hz * n, kRate, 24000, 48000);
}

// The level of the `hz` component over time: one value per `hop` samples.
static std::vector<float> track(const std::vector<float>& x, double hz, size_t from, size_t window,
                                size_t hop) {
  std::vector<float> levels;
  for (size_t at = from; at + window <= x.size(); at += hop) {
    levels.push_back(static_cast<float>(tone_level(x, hz, kRate, at, at + window)));
  }
  return levels;
}

static std::vector<float> without_mean(std::vector<float> x) {
  const double m = mean(x);
  for (float& v : x) v -= static_cast<float>(m);
  return x;
}

// Share of the power that is not within a few bins (or `cents_wide`, for
// detuned oscillators) of a harmonic of `hz`. Blackman-Harris window: side
// lobes 92 dB down.
static livemix::kit::Fft<65536> fft;
static double inharmonic_share(const std::vector<float>& x, double hz, size_t from,
                               double cents_wide = 0.0) {
  const int n = 65536;
  static std::vector<float> re(n), im(n);
  for (int i = 0; i < n; ++i) {
    const double a = 2.0 * kPi * i / n;
    const double w =
        0.35875 - 0.48829 * std::cos(a) + 0.14128 * std::cos(2 * a) - 0.01168 * std::cos(3 * a);
    re[i] = static_cast<float>(w * x[from + i]);
    im[i] = 0.0f;
  }
  fft.forward(re.data(), im.data());
  const double bin_hz = kRate / n;
  double total = 0.0, stray = 0.0;
  for (int k = 8; k < n / 2; ++k) {
    const double power = static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
    const double f = k * bin_hz;
    const double nearest = std::round(f / hz) * hz;
    total += power;
    const double slack = std::max(6.0 * bin_hz, nearest * (std::pow(2.0, cents_wide / 1200.0) - 1.0));
    if (nearest < 0.5 * hz || std::fabs(f - nearest) > slack) stray += power;
  }
  return total > 0.0 ? stray / total : 1.0;
}

static double cents(double measured, double expected) { return 1200.0 * std::log2(measured / expected); }

int main() {
  fft.init();
  {
    const auto start = std::chrono::steady_clock::now();
    untouched.init(kRate);
    const double ms =
        std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - start).count();
    std::printf("wavetable: first init (builds the tables) took %.1f ms (native)\n", ms);
    EXPECT(ms < 500.0, "building the tables takes well under half a second");
  }

  Conformance spec;
  spec.name = "wavetable";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 7.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // Pitch: within 3 cents across the range, for every table.
  for (int table = 0; table < Wavetable::kSets; ++table) {
    for (float hz : {65.41f, 220.0f, 440.0f, 1760.0f}) {
      still(device, table, 0.5f);
      Stereo out = note(device, hz, 1.5f);
      const double found = dominant_frequency(out.left, kRate, hz * 0.8, hz * 1.25, 24000);
      char label[96];
      std::snprintf(label, sizeof label, "table %d plays %.2f Hz within 3 cents (off by %.2f)", table,
                    hz, cents(found, hz));
      EXPECT(std::fabs(cents(found, hz)) < 3.0, label);
    }
  }

  // The ends of each row are the recipes they claim to be.
  {
    still(device, kGlass, 0.0f);
    Stereo sine = note(device, 110.0f, 1.0f);
    double worst = 0.0;
    for (int n = 2; n <= 40; ++n) worst = std::max(worst, harmonic(sine, 110.0, n));
    EXPECT(worst < 0.001 * harmonic(sine, 110.0, 1),
           "Glass starts as a pure sine (harmonics 60 dB down)");

    still(device, kGlass, 1.0f);
    Stereo bell = note(device, 110.0f, 1.0f);
    const double one = harmonic(bell, 110.0, 1);
    EXPECT_NEAR(harmonic(bell, 110.0, 7) / one, 0.38, 0.012, "Glass ends with the bell's 7th partial");
    EXPECT_NEAR(harmonic(bell, 110.0, 16) / one, 0.18, 0.008, "and its 16th");
    EXPECT(harmonic(bell, 110.0, 6) < 0.002 * one && harmonic(bell, 110.0, 8) < 0.002 * one,
           "with nothing on the harmonics the bell leaves out");

    still(device, kReedSaw, 1.0f);
    Stereo saw = note(device, 110.0f, 1.0f);
    const double saw_one = harmonic(saw, 110.0, 1);
    for (int n = 2; n <= 16; ++n) {
      char label[80];
      std::snprintf(label, sizeof label, "Reed to Saw ends as a sawtooth: harmonic %d is 1/%d", n, n);
      EXPECT_NEAR(harmonic(saw, 110.0, n) * n / saw_one, 1.0, 0.03, label);
    }

    still(device, kReedSaw, 0.0f);
    Stereo reed = note(device, 110.0f, 1.0f);
    const double reed_one = harmonic(reed, 110.0, 1);
    EXPECT_NEAR(harmonic(reed, 110.0, 3) / reed_one, 0.3203, 0.01,
                "Reed to Saw starts on odd harmonics");
    EXPECT(harmonic(reed, 110.0, 2) < 0.05 * reed_one && harmonic(reed, 110.0, 4) < 0.03 * reed_one,
           "with the even ones nearly absent");

    still(device, kHollow, 0.0f);
    Stereo square = note(device, 110.0f, 1.0f);
    const double square_one = harmonic(square, 110.0, 1);
    EXPECT_NEAR(harmonic(square, 110.0, 3) / square_one, 0.3328, 0.01, "Hollow starts as a square");
    EXPECT(harmonic(square, 110.0, 2) < 0.001 * square_one &&
               harmonic(square, 110.0, 4) < 0.001 * square_one,
           "with no even harmonics");

    still(device, kHollow, 1.0f);
    Stereo pulse = note(device, 110.0f, 1.0f);
    EXPECT_NEAR(harmonic(pulse, 110.0, 2) / harmonic(pulse, 110.0, 1), 0.929, 0.02,
                "Hollow ends as a 12 % pulse (2nd harmonic nearly as strong as the 1st)");

    // Vowels: 'a' has its first formant near 730 Hz, 'i' near 270 Hz and 2290 Hz.
    still(device, kVowels, 0.0f);
    Stereo ah = note(device, 110.0f, 1.0f);
    still(device, kVowels, 0.5f);
    Stereo ee = note(device, 110.0f, 1.0f);
    EXPECT(harmonic(ah, 110.0, 7) > 3.0 * harmonic(ah, 110.0, 3) &&
               harmonic(ah, 110.0, 10) > harmonic(ah, 110.0, 21),
           "Vowels starts on 'a': formants near 730 Hz and 1090 Hz");
    EXPECT(harmonic(ee, 110.0, 21) > 3.0 * harmonic(ee, 110.0, 10) &&
               harmonic(ee, 110.0, 3) > 3.0 * harmonic(ee, 110.0, 7),
           "and reaches 'i' in the middle: formants near 270 Hz and 2290 Hz, nothing at 1 kHz");
  }

  // Position moves through the row continuously: brightness rises step by
  // step, a slow sweep while a note sounds makes no click, and a jump is
  // smoothed.
  {
    double previous = 0.0;
    bool rising = true;
    double static_step = 0.0;
    for (int step = 0; step <= 8; ++step) {
      still(device, kGlass, static_cast<float>(step) / 8.0f);
      Stereo out = note(device, 220.0f, 1.0f);
      const double bright = energy_above(out.left, 1000.0, kRate, 24000);
      if (step > 0 && !(bright > previous)) rising = false;
      previous = bright;
      static_step = std::max(static_step, max_step(out.left, 24000));
    }
    EXPECT(rising, "Glass gets brighter with every step of Position");

    still(device, kGlass, 0.0f);
    device.note_on(1, 220.0f, 1.0f);
    render(device, 0.5f, kRate);
    Stereo sweep;
    const int blocks = static_cast<int>(3.0f * kRate / kBlock);
    for (int b = 0; b < blocks; ++b) {
      device.set_param(p::kPosition, static_cast<float>(b) / static_cast<float>(blocks - 1));
      sweep = concat(sweep, render(device, static_cast<float>(kBlock) / kRate, kRate));
    }
    EXPECT(max_step(sweep.left) < 1.1 * static_step,
           "sweeping Position while a note sounds does not click");
    // In between two frames the spectrum is in between too.
    const size_t n = sweep.left.size();
    const double early = tone_level(sweep.left, 1540.0, kRate, n / 8, n / 4);
    const double middle = tone_level(sweep.left, 1540.0, kRate, n / 2 - n / 16, n / 2 + n / 16);
    const double late = tone_level(sweep.left, 1540.0, kRate, n - n / 8, n);
    EXPECT(early < middle && middle < late, "and the 7th partial grows all the way along the sweep");

    still(device, kGlass, 0.0f);
    device.note_on(1, 220.0f, 1.0f);
    render(device, 0.5f, kRate);
    device.set_param(p::kPosition, 1.0f);
    Stereo jump = render(device, 0.5f, kRate);
    EXPECT(max_step(jump.left) < 1.1 * static_step, "a jump of Position does not click either");

    // Changing the table dips instead of jumping.
    still(device, kHollow, 0.0f);
    Stereo steady = note(device, 220.0f, 0.5f);
    device.set_param(p::kTable, static_cast<float>(kGlass));
    Stereo change = render(device, 0.5f, kRate);
    EXPECT(max_step(change.left) < 1.1 * max_step(steady.left, 12000), "changing Table does not click");
    EXPECT(tone_level(change.left, 660.0, kRate, 12000) <
               0.01 * tone_level(steady.left, 660.0, kRate, 12000),
           "and the new table is what sounds afterwards");
  }

  // High notes do not alias: at about 3 kHz everything that is not a harmonic
  // of the note is at least 50 dB down, in every table at its brightest.
  {
    const float positions[Wavetable::kSets] = {1.0f, 0.0f, 1.0f, 1.0f, 0.5f};
    double worst = 0.0;
    for (int table = 0; table < Wavetable::kSets; ++table) {
      // G7 reads one level; F7 sits where two levels are crossfaded.
      for (float hz : {3135.96f, 2793.83f}) {
        still(device, table, positions[table]);
        Stereo out = note(device, hz, 2.0f);
        worst = std::max(worst, inharmonic_share(out.left, hz, 24000));
      }
    }
    std::printf("wavetable: worst inharmonic energy near 3 kHz: %.1f dB\n",
                10.0 * std::log10(worst + 1e-30));
    EXPECT(worst < 1.0e-5, "aliasing at a 3 kHz note is at least 50 dB down");

    // The same holds with the oscillators detuned and the position moving.
    still(device, kReedSaw, 0.8f);
    device.set_param(p::kDetune, 12.0f);
    device.set_param(p::kMotion, 0.4f);
    device.set_param(p::kRate, 0.5f);
    Stereo moving = note(device, 3135.96f, 2.0f);
    EXPECT(inharmonic_share(moving.left, 3135.96, 24000, 9.0) < 1.0e-5,
           "and stays there with Detune and Motion running");

    // The top of the range is still the note, not a fold-back.
    still(device, kReedSaw, 1.0f);
    Stereo top = note(device, 9000.0f, 1.0f);
    EXPECT_NEAR(dominant_frequency(top.left, kRate, 200.0, 20000.0, 24000), 9000.0, 20.0,
                "a 9 kHz note is a clean 9 kHz");
    // A low note keeps its upper harmonics.
    still(device, kReedSaw, 1.0f);
    Stereo low = note(device, 55.0f, 1.0f);
    EXPECT_NEAR(harmonic(low, 55.0, 200) * 200.0 / harmonic(low, 55.0, 1), 1.0, 0.1,
                "a low note keeps its 200th harmonic (11 kHz)");
  }

  // Motion moves the position at Rate, and each key at its own phase.
  {
    still(device, kGlass, 0.5f);
    device.set_param(p::kMotion, 0.6f);
    device.set_param(p::kRate, 2.0f);
    Stereo out = note(device, 220.0f, 6.0f);
    std::vector<float> seventh = track(out.left, 1540.0, 24000, 1920, 480);
    const double lo = *std::min_element(seventh.begin(), seventh.end());
    const double hi = *std::max_element(seventh.begin(), seventh.end());
    EXPECT(hi > 2.0 * lo, "Motion swings the level of the 7th partial");
    const double hz = dominant_frequency(without_mean(seventh), 100.0, 0.3, 12.0);
    EXPECT_NEAR(hz, 2.0, 0.06, "at the Rate that is set (2 Hz)");

    still(device, kGlass, 0.5f);
    device.set_param(p::kMotion, 0.6f);
    device.set_param(p::kRate, 0.25f);
    Stereo slow = note(device, 220.0f, 14.0f);
    std::vector<float> slow_seventh = track(slow.left, 1540.0, 24000, 4800, 2400);
    EXPECT_NEAR(dominant_frequency(without_mean(slow_seventh), 20.0, 0.05, 3.0), 0.25, 0.02,
                "and at 0.25 Hz when Rate says so");

    still(device, kGlass, 0.5f);
    Stereo fixed = note(device, 220.0f, 3.0f);
    std::vector<float> flat = track(fixed.left, 1540.0, 24000, 1920, 480);
    EXPECT(
        *std::max_element(flat.begin(), flat.end()) < 1.01 * *std::min_element(flat.begin(), flat.end()),
        "with Motion at 0 the spectrum stands still");

    // Two keys: their 7th partials (1540 Hz and 2310 Hz) do not rise together.
    still(device, kGlass, 0.5f);
    device.set_param(p::kMotion, 0.6f);
    device.set_param(p::kRate, 2.0f);
    device.note_on(1, 220.0f, 1.0f);
    device.note_on(2, 330.0f, 1.0f);
    Stereo chord = render(device, 6.0f, kRate);
    std::vector<float> first = without_mean(track(chord.left, 1540.0, 24000, 1920, 480));
    std::vector<float> second = without_mean(track(chord.left, 2310.0, 24000, 1920, 480));
    EXPECT(correlation(first, second) < 0.3,
           "two keys move out of step, so a chord shimmers rather than pumps");

    // Motion alone opens the stereo image: oscillator B trails A on the LFO.
    still(device, kGlass, 0.5f);
    device.set_param(p::kMotion, 0.8f);
    device.set_param(p::kRate, 2.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo wide = note(device, 220.0f, 3.0f);
    EXPECT(correlation(wide.left, wide.right, 24000) < 0.995 && !(wide.left == wide.right),
           "with Spread, Motion differs between left and right");
  }

  // Detune: the two oscillators beat at the difference of their pitches.
  {
    still(device, kGlass, 0.0f);
    device.set_param(p::kDetune, 20.0f);
    Stereo out = note(device, 440.0f, 5.0f);
    std::vector<float> level;
    for (size_t at = 24000; at + 480 <= out.left.size(); at += 240) {
      level.push_back(static_cast<float>(rms(out.left, at, at + 480)));
    }
    const double expected = 440.0 * (std::pow(2.0, 10.0 / 1200.0) - std::pow(2.0, -10.0 / 1200.0));
    EXPECT_NEAR(dominant_frequency(without_mean(level), 200.0, 1.0, 30.0), expected, 0.1,
                "20 cents of Detune at 440 Hz beats at 5.08 Hz");
    EXPECT(*std::min_element(level.begin(), level.end()) <
               0.15 * *std::max_element(level.begin(), level.end()),
           "the beat is deep with both oscillators in the centre");

    still(device, kGlass, 0.0f);
    Stereo steady = note(device, 440.0f, 2.0f);
    double lo = 1.0e9, hi = 0.0;
    for (size_t at = 24000; at + 4800 <= steady.left.size(); at += 2400) {
      lo = std::min(lo, rms(steady.left, at, at + 4800));
      hi = std::max(hi, rms(steady.left, at, at + 4800));
    }
    EXPECT(hi < 1.005 * lo, "no Detune, no beating");
  }

  // Spread puts the two oscillators on opposite sides.
  {
    still(device, kGlass, 0.3f);
    device.set_param(p::kDetune, 20.0f);
    Stereo centre = note(device, 220.0f, 2.0f);
    EXPECT(centre.left == centre.right, "Spread 0 is mono");
    still(device, kGlass, 0.3f);
    device.set_param(p::kDetune, 20.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo wide = note(device, 220.0f, 4.0f);
    EXPECT(correlation(wide.left, wide.right, 24000) < 0.5, "Spread 1 decorrelates left and right");
    EXPECT_NEAR(rms(wide.left, 24000) / rms(wide.right, 24000), 1.0, 0.1,
                "and keeps the sides balanced");
  }

  // Sub adds a sine an octave below and nothing else.
  {
    still(device, kReedSaw, 1.0f);
    Stereo plain = note(device, 220.0f, 1.0f);
    still(device, kReedSaw, 1.0f);
    device.set_param(p::kSub, 1.0f);
    Stereo sub = note(device, 220.0f, 1.0f);
    EXPECT(tone_level(plain.left, 110.0, kRate, 24000) < 0.0005, "no octave below with Sub at 0");
    EXPECT(tone_level(sub.left, 110.0, kRate, 24000) > 0.5 * tone_level(sub.left, 220.0, kRate, 24000),
           "Sub adds the octave below");
    EXPECT(tone_level(sub.left, 330.0, kRate, 24000) < 0.01 * tone_level(sub.left, 110.0, kRate, 24000),
           "as a sine");
  }

  // Cutoff removes what is above it; Resonance raises what is on it.
  {
    still(device, kReedSaw, 1.0f);
    Stereo open = note(device, 110.0f, 1.0f);
    still(device, kReedSaw, 1.0f);
    device.set_param(p::kCutoff, 440.0f);
    Stereo dark = note(device, 110.0f, 1.0f);
    EXPECT(harmonic(dark, 110.0, 32) < 0.03 * harmonic(open, 110.0, 32),
           "Cutoff at 440 Hz removes 3.5 kHz");
    EXPECT_NEAR(harmonic(dark, 110.0, 4) / harmonic(open, 110.0, 4), 0.7071, 0.1,
                "is 3 dB down at the cutoff");
    EXPECT(harmonic(dark, 110.0, 1) > 0.9 * harmonic(open, 110.0, 1), "and leaves the fundamental");

    still(device, kReedSaw, 1.0f);
    device.set_param(p::kCutoff, 880.0f);
    Stereo flat = note(device, 110.0f, 1.0f);
    still(device, kReedSaw, 1.0f);
    device.set_param(p::kCutoff, 880.0f);
    device.set_param(p::kResonance, 1.0f);
    Stereo peaked = note(device, 110.0f, 1.0f);
    const double flat_ratio = harmonic(flat, 110.0, 8) / harmonic(flat, 110.0, 1);
    const double peaked_ratio = harmonic(peaked, 110.0, 8) / harmonic(peaked, 110.0, 1);
    EXPECT(peaked_ratio > 10.0 * flat_ratio,
           "Resonance lifts the harmonic at the cutoff by more than 20 dB");
    EXPECT(peak(peaked.left) < 2.0 * peak(flat.left), "without the level running away");

    // Sweeping the cutoff with the resonance up does not click.
    still(device, kGlass, 0.0f);
    device.set_param(p::kResonance, 0.8f);
    device.set_param(p::kCutoff, 300.0f);
    device.note_on(1, 110.0f, 1.0f);
    Stereo before = render(device, 0.5f, kRate);
    device.set_param(p::kCutoff, 6000.0f);
    Stereo after = render(device, 0.5f, kRate);
    EXPECT(max_step(after.left) < 2.0 * max_step(after.left, 12000) + 1.0e-4,
           "a jump of Cutoff under resonance does not click");
    (void)before;
  }

  // The five tables are five different sounds.
  {
    double shape[Wavetable::kSets][32];
    for (int table = 0; table < Wavetable::kSets; ++table) {
      still(device, table, 0.5f);
      Stereo out = note(device, 110.0f, 1.0f);
      double norm = 0.0;
      for (int n = 0; n < 32; ++n) {
        shape[table][n] = harmonic(out, 110.0, n + 2);  // the fundamental is common to all
        norm += shape[table][n] * shape[table][n];
      }
      for (int n = 0; n < 32; ++n) shape[table][n] /= std::sqrt(norm);
    }
    double closest = 0.0;
    for (int a = 0; a < Wavetable::kSets; ++a) {
      for (int b = a + 1; b < Wavetable::kSets; ++b) {
        double dot = 0.0;
        for (int n = 0; n < 32; ++n) dot += shape[a][n] * shape[b][n];
        closest = std::max(closest, dot);
      }
    }
    std::printf("wavetable: most alike pair of tables has spectral similarity %.3f\n", closest);
    EXPECT(closest < 0.9, "no two tables share a spectrum above the fundamental at mid position");

    // Spectral evolves along its row rather than standing still.
    still(device, kSpectral, 0.0f);
    Stereo first = note(device, 110.0f, 1.0f);
    still(device, kSpectral, 1.0f);
    Stereo last = note(device, 110.0f, 1.0f);
    double dot = 0.0, na = 0.0, nb = 0.0;
    for (int n = 1; n <= 40; ++n) {
      const double a = harmonic(first, 110.0, n), b = harmonic(last, 110.0, n);
      dot += a * b;
      na += a * a;
      nb += b * b;
    }
    EXPECT(dot / std::sqrt(na * nb) < 0.9, "Spectral's clusters have moved by the end of the row");
    // Frames along a row are equally loud.
    EXPECT_NEAR(rms(first.left, 24000) / rms(last.left, 24000), 1.0, 0.1,
                "frames of a row are equally loud");
  }

  // Attack and release are the times they say.
  {
    still(device, kGlass, 0.3f);
    device.set_param(p::kAttack, 2.0f);
    device.set_param(p::kRelease, 2.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo rise = render(device, 4.0f, kRate);
    const double full = rms(rise.left, 144000, 192000);
    EXPECT(rms(rise.left, 0, 9600) < 0.3 * full, "a 2 s attack is still quiet after 200 ms");
    EXPECT(rms(rise.left, 100800, 110400) > 0.95 * full, "and has arrived shortly after 2 s");
    device.note_off(1);
    Stereo fall = render(device, 5.0f, kRate);
    EXPECT(rms(fall.left, 43200, 48000) > 0.02 * full, "a 2 s release is still audible at 0.95 s");
    EXPECT(rms(fall.left, 96000, 100800) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(peak(fall.left, 192000, 240000) == 0.0, "and is exactly silent soon after");
  }

  // Levels: one key sits at a sane level, ten stay under the clip knee, and
  // loudness follows velocity.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo one = render(device, 6.0f, kRate);
    const double level_db = db(std::max(peak(one.left, 96000), peak(one.right, 96000)));
    std::printf("wavetable: one key at the default patch peaks at %.1f dBFS\n", level_db);
    EXPECT(level_db > -24.0 && level_db < -10.0,
           "one key at velocity 0.7 peaks between -24 and -10 dBFS");

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo ten = render(device, 8.0f, kRate);
    std::printf("wavetable: ten keys peak at %.2f\n", std::max(peak(ten.left), peak(ten.right)));
    EXPECT(peak(ten.left) < 0.5 && peak(ten.right) < 0.5, "ten keys stay under the clip knee");

    still(device, kGlass, 0.3f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo loud = render(device, 0.5f, kRate);
    still(device, kGlass, 0.3f);
    device.note_on(1, 220.0f, 0.1f);
    Stereo soft = render(device, 0.5f, kRate);
    EXPECT(rms(soft.left, 12000) < 0.6 * rms(loud.left, 12000), "soft keys are quieter");

    still(device, kGlass, 0.3f);
    device.set_param(p::kVolume, -20.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo quiet = render(device, 0.5f, kRate);
    EXPECT_NEAR(rms(quiet.left, 12000) / rms(loud.left, 12000), 0.1, 0.002, "Volume is in decibels");
  }

  // Cost with every voice sounding.
  device.init(kRate);
  for (int n = 0; n < 16; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  report_cost("wavetable (16 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("wavetable");
}
