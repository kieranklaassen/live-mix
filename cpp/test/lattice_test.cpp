// Native harness for Lattice (cpp/devices/lattice). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a scale-aware harmonizer.
//
// LATTICE_VERBOSE=1 in the environment prints every measured value.

#include <cstdlib>

#include "../devices/lattice/lattice.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Lattice;
namespace p = livemix::lattice;

static Lattice device;
static ::lattice::PitchTracker tracker;

static const float kRate = 48000.0f;

enum Role { kOff, kInterval, kMirror, kMiddle, kMirrorMiddle, kOctaflip, kCenterRole };
enum ScaleChoice { kMajor = 0, kNaturalMinor = 1, kChromatic = 13, kCustom = 14 };

static bool verbose() {
  static const bool on = std::getenv("LATTICE_VERBOSE") != nullptr;
  return on;
}

static void show(const char* what, double value) {
  if (verbose()) std::printf("  %-58s %.5g\n", what, value);
}

static double cents_between(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

static double note_hz(double midi) { return 440.0 * std::pow(2.0, (midi - 69.0) / 12.0); }

static int voice_param(int voice, int which) { return p::kV1Role + 6 * voice + (which - p::kV1Role); }

// One voice, centred, at unity, wet only; the scale is chromatic so "degrees"
// are semitones.
static void solo(Lattice& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kScale, kChromatic);
  d.set_param(p::kMix, 100.0f);
  d.set_param(p::kV1Role, kInterval);
  d.set_param(p::kV1Degrees, 0.0f);
  d.set_param(p::kV1Level, 0.0f);
  d.set_param(p::kV1Pan, 0.0f);
  d.set_param(p::kV2Role, kOff);
  d.set_param(p::kV3Role, kOff);
  d.set_param(p::kV4Role, kOff);
}

// A band-limited tone with a few harmonics, closer to an instrument than a sine.
static std::vector<float> harmonic_tone(float hz, float seconds, float rate, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    out[i] = gain * static_cast<float>(std::sin(phase) + 0.5 * std::sin(2.0 * phase + 0.4) +
                                       0.33 * std::sin(3.0 * phase + 1.1) +
                                       0.2 * std::sin(4.0 * phase + 2.0)) /
             1.6f;
  }
  return out;
}

// A sine burst with 5 ms raised-cosine edges, followed by silence.
static std::vector<float> burst(float hz, float on_seconds, float total_seconds, float rate, float gain) {
  std::vector<float> out = sine(hz, on_seconds, rate, gain);
  const size_t edge = static_cast<size_t>(0.005f * rate);
  for (size_t i = 0; i < edge && i < out.size(); ++i) {
    const float w = 0.5f - 0.5f * static_cast<float>(std::cos(kPi * static_cast<double>(i) / edge));
    out[i] *= w;
    out[out.size() - 1 - i] *= w;
  }
  out.resize(static_cast<size_t>(total_seconds * rate), 0.0f);
  return out;
}

// First sample where |x| reaches `threshold`.
static size_t onset(const std::vector<float>& x, double threshold, size_t from = 0) {
  for (size_t i = from; i < x.size(); ++i) {
    if (std::fabs(x[i]) >= threshold) return i;
  }
  return x.size();
}

// The strongest frequency in [lo, hi] over [from, to): the largest bin of a
// Hann-windowed 65536-point spectrum, refined with the test kit's Goertzel.
// (testkit::dominant_frequency scans 600 Goertzel passes; this harness asks
// about a hundred times.)
static double strongest_frequency(const std::vector<float>& x, double rate, double lo, double hi, size_t from,
                                  size_t to) {
  static livemix::kit::Fft<65536> fft;
  static float re[65536], im[65536];
  static bool ready = false;
  if (!ready) {
    fft.init();
    ready = true;
  }
  const int size = 65536;
  to = std::min(to, x.size());
  const size_t n = std::min(to - from, static_cast<size_t>(size));
  for (int i = 0; i < size; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    re[i] = static_cast<size_t>(i) < n ? static_cast<float>(w) * x[from + i] : 0.0f;
    im[i] = 0.0f;
  }
  fft.forward(re, im);
  const double bin = rate / size;
  int best = 1;
  double best_power = -1.0;
  for (int k = std::max(1, static_cast<int>(lo / bin)); k < size / 2 && k * bin <= hi; ++k) {
    const double power = static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
    if (power > best_power) {
      best_power = power;
      best = k;
    }
  }
  double best_hz = best * bin, best_level = -1.0, span = bin;
  for (int pass = 0; pass < 4; ++pass) {
    const double centre = best_hz;
    for (int i = -10; i <= 10; ++i) {
      const double hz = centre + span * i / 10.0;
      const double level = tone_level(x, hz, rate, from, from + n);
      if (level > best_level) {
        best_level = level;
        best_hz = hz;
      }
    }
    span /= 10.0;
  }
  return best_hz;
}

// The strongest frequency of the settled part of a steady render.
static double settled_frequency(const std::vector<float>& x, float rate, double lo = 60.0,
                                double hi = 3000.0) {
  return strongest_frequency(x, rate, lo, hi, static_cast<size_t>(0.3f * rate), x.size());
}

// Samples until the frequency read from successive rising zero crossings first reaches `hz`.
static double time_to_frequency(const std::vector<float>& x, float rate, double hz) {
  double previous = -1.0;
  for (size_t i = 1; i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double crossing = static_cast<double>(i - 1) + x[i - 1] / (x[i - 1] - x[i]);
      if (previous >= 0.0 && rate / (crossing - previous) >= hz) return 0.5 * (crossing + previous);
      previous = crossing;
    }
  }
  return static_cast<double>(x.size());
}

// What is left of [from, to) once the best-fitting sinusoids at the given
// frequencies are removed (least squares, so amplitude and phase are free),
// relative to what was removed, in dB: the level of everything that is not
// one of the expected partials.
static double residual_db(const std::vector<float>& x, const std::vector<double>& partials, float rate,
                          size_t from, size_t to) {
  const int n = 2 * static_cast<int>(partials.size());
  std::vector<double> gram(static_cast<size_t>(n * n), 0.0), rhs(static_cast<size_t>(n), 0.0);
  std::vector<double> basis(static_cast<size_t>(n));
  const auto fill_basis = [&](size_t i) {
    for (size_t k = 0; k < partials.size(); ++k) {
      const double phase = 2.0 * kPi * partials[k] * static_cast<double>(i) / rate;
      basis[2 * k] = std::cos(phase);
      basis[2 * k + 1] = std::sin(phase);
    }
  };
  for (size_t i = from; i < to; ++i) {
    fill_basis(i);
    for (int r = 0; r < n; ++r) {
      rhs[r] += basis[r] * x[i];
      for (int c = 0; c < n; ++c) gram[r * n + c] += basis[r] * basis[c];
    }
  }
  // Gaussian elimination with partial pivoting.
  std::vector<double> weights = rhs;
  for (int col = 0; col < n; ++col) {
    int pivot = col;
    for (int r = col + 1; r < n; ++r) {
      if (std::fabs(gram[r * n + col]) > std::fabs(gram[pivot * n + col])) pivot = r;
    }
    for (int c = 0; c < n; ++c) std::swap(gram[col * n + c], gram[pivot * n + c]);
    std::swap(weights[col], weights[pivot]);
    for (int r = col + 1; r < n; ++r) {
      const double factor = gram[r * n + col] / gram[col * n + col];
      for (int c = col; c < n; ++c) gram[r * n + c] -= factor * gram[col * n + c];
      weights[r] -= factor * weights[col];
    }
  }
  for (int r = n - 1; r >= 0; --r) {
    for (int c = r + 1; c < n; ++c) weights[r] -= gram[r * n + c] * weights[c];
    weights[r] /= gram[r * n + r];
  }
  double fitted = 0.0, rest = 0.0;
  for (size_t i = from; i < to; ++i) {
    fill_basis(i);
    double model = 0.0;
    for (int r = 0; r < n; ++r) model += weights[r] * basis[r];
    fitted += model * model;
    rest += (x[i] - model) * (x[i] - model);
  }
  return 10.0 * std::log10(std::max(rest, 1.0e-30) / std::max(fitted, 1.0e-30));
}

// The frequency a voice lands on for a steady input note with the given setup.
template <typename Setup>
static double voiced_output(float input_hz, Setup setup, float rate = kRate) {
  solo(device, rate);
  setup(device);
  Stereo out = run(device, harmonic_tone(input_hz, 1.0f, rate, 0.4f));
  return settled_frequency(out.left, rate);
}

int main() {
  Conformance spec;
  spec.name = "lattice";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // At defaults nothing feeds back: the idle hold (1.25 s) plus the last grain.
  spec.tail_seconds = 1.5f;
  // The output ceiling: linear to +12 dBFS, never above +18 dBFS.
  spec.max_peak = 8.01f;
  check_effect(device, spec, kRate);

  // --- the shifter: interval in, frequency out ---------------------------------------------
  {
    const struct {
      float semitones;
      double expected;
    } cases[] = {{7.0f, 659.2551}, {-12.0f, 220.0}, {12.0f, 880.0}, {-5.0f, 329.6276}, {14.0f, 987.7666}};
    for (const auto& c : cases) {
      solo(device);
      device.set_param(p::kV1Degrees, c.semitones);
      Stereo out = run(device, sine(440.0f, 1.0f, kRate, 0.5f));
      const double hz = settled_frequency(out.left, kRate);
      const double level = tone_level(out.left, hz, kRate, 14400, 48000);
      char label[120];
      std::snprintf(label, sizeof label, "440 Hz shifted %+g semitones lands on %.2f Hz (cents off)",
                    c.semitones, c.expected);
      show(label, cents_between(hz, c.expected));
      EXPECT_NEAR(cents_between(hz, c.expected), 0.0, 1.0, label);
      // Unity voice, centred: the tone comes out at the pan law's -3 dB.
      show("  its level relative to the input, dB", db(level / 0.5));
      EXPECT_NEAR(db(level / 0.5), -3.01, 0.1, "a shifted voice keeps the input level (less the pan law)");
    }
    // Two octaves, the widest shift: fourteen steps of a seven-note scale.
    const double two_octaves = voiced_output(440.0f, [](Lattice& d) {
      d.set_param(p::kScale, kMajor);
      d.set_param(p::kV1Degrees, 14.0f);
    });
    show("A4 up fourteen steps of C major (cents off 1760 Hz)", cents_between(two_octaves, 1760.0));
    EXPECT_NEAR(cents_between(two_octaves, 1760.0), 0.0, 1.0, "fourteen major-scale steps are two octaves");
  }

  // --- the scale decides what a "third" is -------------------------------------------------
  {
    const auto third_in = [](int scale, float midi) {
      return voiced_output(static_cast<float>(note_hz(midi)), [scale](Lattice& d) {
        d.set_param(p::kScale, static_cast<float>(scale));
        d.set_param(p::kV1Degrees, 2.0f);
      });
    };
    const struct {
      int scale;
      float in_note;
      float out_note;
      const char* label;
    } cases[] = {
        {kMajor, 60.0f, 64.0f, "C major: C4 + third = E4 (major third)"},
        {kMajor, 62.0f, 65.0f, "C major: D4 + third = F4 (minor third)"},
        {kNaturalMinor, 60.0f, 63.0f, "C minor: C4 + third = Eb4 (minor third)"},
        {kNaturalMinor, 63.0f, 67.0f, "C minor: Eb4 + third = G4 (major third)"},
    };
    for (const auto& c : cases) {
      const double hz = third_in(c.scale, c.in_note);
      show(c.label, cents_between(hz, note_hz(c.out_note)));
      EXPECT_NEAR(cents_between(hz, note_hz(c.out_note)), 0.0, 1.0, c.label);
    }
    // Root moves the same pattern: in A major, A4 + third = C#5.
    const double a_major = voiced_output(440.0f, [](Lattice& d) {
      d.set_param(p::kScale, kMajor);
      d.set_param(p::kRoot, 9.0f);
      d.set_param(p::kV1Degrees, 2.0f);
    });
    show("A major: A4 + third = C#5 (cents off)", cents_between(a_major, note_hz(73.0)));
    EXPECT_NEAR(cents_between(a_major, note_hz(73.0)), 0.0, 1.0, "Root transposes the scale");
    // ... while in C major the same A4 gets a minor third (C5).
    const double c_major = voiced_output(440.0f, [](Lattice& d) {
      d.set_param(p::kScale, kMajor);
      d.set_param(p::kV1Degrees, 2.0f);
    });
    EXPECT_NEAR(cents_between(c_major, note_hz(72.0)), 0.0, 1.0, "C major: A4 + third = C5");
  }

  // --- Thesis voicing roles around the Center Note (D4 in C major) -------------------------
  {
    const struct {
      int role;
      float in_note;
      float degrees;
      float out_note;
      const char* label;
    } cases[] = {
        {kMirror, 65.0f, 0.0f, 59.0f, "Mirror: F4 (two steps above D4) becomes B3 (two below)"},
        {kMirror, 57.0f, 0.0f, 67.0f, "Mirror: A3 (three steps below D4) becomes G4 (three above)"},
        {kMiddle, 65.0f, 0.0f, 64.0f, "Middle: halfway between F4 and D4 is E4"},
        {kMiddle, 57.0f, 0.0f, 59.0f, "Middle: halfway between A3 and D4 rounds down to B3"},
        {kMirrorMiddle, 65.0f, 0.0f, 60.0f, "Mirror Middle: from F4, the middle (E4) mirrored around D4 is C4"},
        {kMirrorMiddle, 57.0f, 0.0f, 65.0f, "Mirror Middle: from A3, the middle (B3) mirrored around D4 is F4"},
        {kOctaflip, 65.0f, 0.0f, 53.0f, "Octaflip: F4 above the centre drops an octave"},
        {kOctaflip, 57.0f, 0.0f, 69.0f, "Octaflip: A3 below the centre rises an octave"},
        {kCenterRole, 65.0f, 0.0f, 62.0f, "Center: any note becomes the centre, D4"},
        {kCenterRole, 57.0f, 2.0f, 65.0f, "Center + 2: any note becomes F4"},
        {kMirror, 65.0f, -7.0f, 47.0f, "Mirror - 7: the mirrored note an octave down"},
    };
    for (const auto& c : cases) {
      const double hz = voiced_output(static_cast<float>(note_hz(c.in_note)), [&c](Lattice& d) {
        d.set_param(p::kScale, kMajor);
        d.set_param(p::kCenter, 62.0f);
        d.set_param(p::kV1Role, static_cast<float>(c.role));
        d.set_param(p::kV1Degrees, c.degrees);
      });
      show(c.label, cents_between(hz, note_hz(c.out_note)));
      EXPECT_NEAR(cents_between(hz, note_hz(c.out_note)), 0.0, 1.0, c.label);
    }
    // The centre itself moves the mirror: around A4, F4 mirrors to C5.
    const double moved = voiced_output(static_cast<float>(note_hz(65.0)), [](Lattice& d) {
      d.set_param(p::kScale, kMajor);
      d.set_param(p::kCenter, 69.0f);
      d.set_param(p::kV1Role, kMirror);
    });
    EXPECT_NEAR(cents_between(moved, note_hz(72.0)), 0.0, 1.0, "Center Note moves the mirror axis");
  }

  // --- Snap: keep the player's tuning, or tune the voices to the scale ---------------------
  {
    const float sharp_c4 = static_cast<float>(note_hz(60.3));  // C4, 30 cents sharp
    const auto third = [sharp_c4](float snap) {
      return voiced_output(sharp_c4, [snap](Lattice& d) {
        d.set_param(p::kScale, kMajor);
        d.set_param(p::kV1Degrees, 2.0f);
        d.set_param(p::kSnap, snap);
      });
    };
    const double kept = cents_between(third(0.0f), note_hz(64.0));
    const double half = cents_between(third(50.0f), note_hz(64.0));
    const double tuned = cents_between(third(100.0f), note_hz(64.0));
    show("Snap 0: third above a 30 ct sharp C4, cents from E4", kept);
    show("Snap 50", half);
    show("Snap 100", tuned);
    EXPECT_NEAR(kept, 30.0, 1.0, "Snap 0 keeps the input's 30 cents (interval preserved)");
    EXPECT_NEAR(half, 15.0, 1.0, "Snap 50 halves the deviation");
    EXPECT_NEAR(tuned, 0.0, 1.0, "Snap 100 lands on the scale degree (hard-tuned)");
  }

  // --- a note near the border between two degrees does not flutter -------------------------
  {
    // Interval 0 at Snap 100 plays the degree the input was assigned to. A
    // note has to pass the midpoint by 10 cents (20 cents nearer the new
    // degree than the old) before the assignment moves.
    const auto assigned = [](float second_note) {
      solo(device);
      device.set_param(p::kSnap, 100.0f);
      run(device, harmonic_tone(static_cast<float>(note_hz(60.2)), 0.5f, kRate, 0.4f));  // C4, clearly
      Stereo out = run(device, harmonic_tone(static_cast<float>(note_hz(second_note)), 1.0f, kRate, 0.4f));
      return cents_between(settled_frequency(out.left, kRate), note_hz(60.0));
    };
    const double stays = assigned(60.57f);   // 7 cents past the midpoint
    const double moves = assigned(60.63f);   // 13 cents past the midpoint
    show("from C4: a note 57 ct above C4 is played as (ct above C4)", stays);
    show("from C4: a note 63 ct above C4 is played as (ct above C4)", moves);
    EXPECT_NEAR(stays, 0.0, 2.0, "7 cents past the midpoint the note still belongs to C4");
    EXPECT_NEAR(moves, 100.0, 2.0, "13 cents past the midpoint it has moved to C#4");
  }

  // --- the tracker --------------------------------------------------------------------------
  {
    const auto track = [](const std::vector<float>& x, float rate) {
      tracker.prepare(rate);
      for (float v : x) tracker.pushSample(v);
      return tracker.isVoiced() ? static_cast<double>(tracker.getFrequency()) : 0.0;
    };
    double worst = 0.0;
    for (float hz : {80.0f, 110.0f, 164.81f, 261.63f, 440.0f, 698.46f, 1000.0f}) {
      const double plain = track(sine(hz, 0.3f, kRate, 0.3f), kRate);
      const double rich = track(harmonic_tone(hz, 0.3f, kRate, 0.3f), kRate);
      const double high_rate = track(harmonic_tone(hz, 0.3f, 96000.0f, 0.3f), 96000.0f);
      const double low_rate = track(sine(hz, 0.3f, 44100.0f, 0.3f), 44100.0f);
      for (double found : {plain, rich, high_rate, low_rate}) {
        const double off = found > 0.0 ? std::fabs(cents_between(found, hz)) : 1200.0;
        worst = std::max(worst, off);
      }
      if (verbose()) {
        std::printf("  tracker at %7.2f Hz: sine %+.3f ct, harmonic %+.3f ct, 96 kHz %+.3f ct, 44.1 kHz %+.3f ct\n",
                    hz, cents_between(plain, hz), cents_between(rich, hz), cents_between(high_rate, hz),
                    cents_between(low_rate, hz));
      }
    }
    show("tracker: worst error 80..1000 Hz, cents", worst);
    EXPECT(worst < 2.0, "the tracker is within 2 cents from 80 to 1000 Hz, sine or harmonic, at 44.1/48/96 kHz");

    rng_state() = 0x5EEDu;
    EXPECT(track(noise(0.3f, kRate, 0.3f), kRate) == 0.0, "the tracker calls noise unpitched");
    EXPECT(track(sine(440.0f, 0.3f, kRate, 0.0005f), kRate) == 0.0, "the tracker ignores a tone under -60 dBFS");

    // A missing fundamental is still heard at the fundamental.
    std::vector<float> hollow(static_cast<size_t>(0.3f * kRate));
    for (size_t i = 0; i < hollow.size(); ++i) {
      const double phase = 2.0 * kPi * 150.0 * static_cast<double>(i) / kRate;
      hollow[i] = 0.2f * static_cast<float>(std::sin(2.0 * phase) + std::sin(3.0 * phase) + std::sin(4.0 * phase));
    }
    EXPECT_NEAR(cents_between(track(hollow, kRate), 150.0), 0.0, 1.0, "harmonics 2-4 of 150 Hz are tracked as 150 Hz");

    // One estimate per 256-sample hop, and its two transforms half a hop
    // apart: no 128-sample stretch (one worklet block) ever holds both.
    tracker.prepare(kRate);
    int estimates = 0, busiest = 0;
    std::vector<long> transforms_at;
    for (float v : sine(220.0f, 1.0f, kRate, 0.3f)) {
      estimates += tracker.pushSample(v) ? 1 : 0;
      transforms_at.push_back(tracker.getTransformCount());
    }
    for (size_t i = 128; i < transforms_at.size(); ++i) {
      busiest = std::max(busiest, static_cast<int>(transforms_at[i] - transforms_at[i - 128]));
    }
    EXPECT(estimates == 187, "one estimate per 256-sample hop (187 in a second at 48 kHz)");
    EXPECT(tracker.getTransformCount() == 2 * 187, "two transforms per hop");
    EXPECT(busiest == 1, "the two transforms never fall within the same 128 samples");

    // The device follows a change of note within 60 ms.
    solo(device);
    run(device, sine(220.0f, 0.5f, kRate, 0.4f));
    EXPECT(device.tracking(), "the device reports a tracked pitch");
    EXPECT_NEAR(cents_between(device.tracked_hz(), 220.0), 0.0, 2.0, "the device tracks 220 Hz");
    run(device, sine(330.0f, 0.06f, kRate, 0.4f));
    show("60 ms after 220 -> 330 Hz the tracker reads (cents off 330)", cents_between(device.tracked_hz(), 330.0));
    EXPECT_NEAR(cents_between(device.tracked_hz(), 330.0), 0.0, 10.0, "a new note is tracked within 60 ms");
  }

  // --- unpitched input holds the last harmony ----------------------------------------------
  {
    // Before anything has been tracked the voice passes unshifted.
    solo(device);
    device.set_param(p::kV1Degrees, 12.0f);
    Stereo quiet = run(device, sine(300.0f, 1.0f, kRate, 0.0005f));  // under the tracker's gate
    EXPECT_NEAR(cents_between(settled_frequency(quiet.left, kRate), 300.0), 0.0, 1.0,
                "nothing tracked yet: the voice is unshifted");
    // After a tracked note the octave stays while the input is too quiet to
    // track. Without a period the splices are not aligned, and a steady tone
    // is then pulled by up to half the splice rate: 8 Hz at a 60 ms window.
    solo(device);
    device.set_param(p::kV1Degrees, 12.0f);
    device.set_param(p::kWindow, 60.0f);
    run(device, sine(440.0f, 0.5f, kRate, 0.4f));
    run(device, silence(0.3f, kRate));
    quiet = run(device, sine(300.0f, 1.5f, kRate, 0.0005f));
    const double held = settled_frequency(quiet.left, kRate);
    show("held octave on an untracked 300 Hz tone, Hz", held);
    EXPECT_NEAR(held, 600.0, 8.5, "the last harmony is held while the input is untracked");
  }

  // --- per-voice delay ----------------------------------------------------------------------
  {
    const auto arrival = [](float delay_ms) {
      solo(device);
      device.set_param(p::kV1Degrees, 7.0f);
      device.set_param(p::kV1Delay, delay_ms);
      Stereo out = run(device, burst(440.0f, 0.2f, 1.0f, kRate, 0.5f));
      return static_cast<double>(onset(out.left, 0.05));
    };
    const double direct = arrival(0.0f);
    const double late = arrival(250.0f);
    const double later = arrival(500.0f);
    show("voice with no delay arrives after, ms", direct / 48.0);
    show("250 ms of delay adds, samples", late - direct);
    show("500 ms of delay adds, samples", later - direct);
    EXPECT(direct < 0.03 * kRate, "an undelayed voice arrives within 30 ms");
    EXPECT_NEAR(late - direct, 12000.0, 2.0, "Delay 250 ms arrives 250 ms later");
    EXPECT_NEAR(later - direct, 24000.0, 2.0, "Delay 500 ms arrives 500 ms later");

    // Voices have their own delays: voice 2 a fifth up at 300 ms, voice 1 at 0.
    solo(device);
    device.set_param(p::kV1Degrees, 0.0f);
    device.set_param(p::kV2Role, kInterval);
    device.set_param(p::kV2Degrees, 7.0f);
    device.set_param(p::kV2Level, 0.0f);
    device.set_param(p::kV2Pan, 0.0f);
    device.set_param(p::kV2Delay, 300.0f);
    Stereo out = run(device, burst(440.0f, 0.2f, 1.0f, kRate, 0.5f));
    const double early_unison = tone_level(out.left, 440.0, kRate, 2400, 9600);
    const double early_fifth = tone_level(out.left, 659.26, kRate, 2400, 9600);
    const double late_unison = tone_level(out.left, 440.0, kRate, 16800, 24000);
    const double late_fifth = tone_level(out.left, 659.26, kRate, 16800, 24000);
    EXPECT(early_unison > 0.2 && early_fifth < 0.01, "the undelayed voice sounds first, alone");
    EXPECT(late_fifth > 0.2 && late_unison < 0.01, "the delayed voice sounds 300 ms later, alone");
  }

  // --- feedback -----------------------------------------------------------------------------
  {
    // Echo (the original path): every repeat keeps the voice's pitch and drops by Feedback.
    const auto echo = [](float path) {
      solo(device);
      device.set_param(p::kV1Degrees, 7.0f);
      device.set_param(p::kV1Delay, 300.0f);
      device.set_param(p::kV1Feedback, 50.0f);
      device.set_param(p::kFeedbackPath, path);
      return run(device, burst(440.0f, 0.2f, 2.0f, kRate, 0.5f));
    };
    const size_t d = 14400;        // 300 ms
    const size_t a = 4800, b = 9120;  // the steady part of each 200 ms repeat
    Stereo out = echo(0.0f);
    double hz[4], level[4];
    for (int n = 0; n < 4; ++n) {
      const size_t from = (n + 1) * d + a, to = (n + 1) * d + b;
      hz[n] = strongest_frequency(out.left, kRate, 300.0, 3000.0, from, to);
      level[n] = rms(out.left, from, to);
      if (verbose()) std::printf("  echo repeat %d: %.2f Hz, %.2f dB\n", n + 1, hz[n], db(level[n]));
    }
    for (int n = 0; n < 4; ++n) {
      EXPECT_NEAR(cents_between(hz[n], 659.2551), 0.0, 5.0, "Echo: every repeat stays a fifth above the input");
    }
    for (int n = 1; n < 4; ++n) {
      EXPECT_NEAR(db(level[n] / level[n - 1]), -6.02, 0.3, "Echo: each repeat is Feedback (50 %) of the one before");
    }

    // Cascade: the repeats go round through the shifter, a fifth higher each
    // time, and each is spliced on its own period (carried round the loop),
    // so they stay in tune.
    out = echo(1.0f);
    const double expected[4] = {659.2551, 987.7666, 1479.978, 2217.461};
    for (int n = 0; n < 4; ++n) {
      // Each trip also passes the shifter, about 15 ms.
      const size_t from = (n + 1) * d + a + n * 720, to = (n + 1) * d + b + n * 720;
      hz[n] = strongest_frequency(out.left, kRate, 300.0, 4000.0, from, to);
      level[n] = rms(out.left, from, to);
      if (verbose()) {
        std::printf("  cascade repeat %d: %.2f Hz (%+.2f ct), %.2f dB\n", n + 1, hz[n],
                    cents_between(hz[n], expected[n]), db(level[n]));
      }
    }
    EXPECT_NEAR(cents_between(hz[0], expected[0]), 0.0, 5.0, "Cascade: the first arrival is shifted once");
    EXPECT_NEAR(cents_between(hz[1], expected[1]), 0.0, 5.0, "Cascade: the second repeat is shifted twice");
    EXPECT_NEAR(cents_between(hz[2], expected[2]), 0.0, 5.0, "Cascade: the third repeat is shifted three times");
    EXPECT_NEAR(cents_between(hz[3], expected[3]), 0.0, 5.0, "Cascade: the fourth repeat is shifted four times");
    for (int n = 1; n < 4; ++n) {
      const double step = db(level[n] / level[n - 1]);
      EXPECT(step < -6.0 && step > -7.0, "Cascade: each repeat drops by Feedback and a little treble");
    }

    // An octave cascade under a held note: every generation sounds at once
    // (880, 1760, 3520 Hz from 440), each on pitch and 50 % of the one before.
    solo(device);
    device.set_param(p::kV1Degrees, 12.0f);
    device.set_param(p::kV1Delay, 300.0f);
    device.set_param(p::kV1Feedback, 50.0f);
    device.set_param(p::kFeedbackPath, 1.0f);
    out = run(device, sine(440.0f, 4.0f, kRate, 0.5f));
    double previous = 0.0;
    for (int n = 1; n <= 3; ++n) {
      const double nominal = 440.0 * std::pow(2.0, n);
      const double found = strongest_frequency(out.left, kRate, nominal * 0.9, nominal * 1.1, 96000, 192000);
      const double generation = tone_level(out.left, found, kRate, 96000, 192000);
      if (verbose()) {
        std::printf("  held octave cascade, generation %d: %+.2f ct, %.2f dB\n", n, cents_between(found, nominal),
                    db(generation));
      }
      EXPECT_NEAR(cents_between(found, nominal), 0.0, 2.0, "Cascade: octaves stack in tune under a held note");
      if (n > 1) {
        const double step = db(generation / previous);
        EXPECT(step < -6.0 && step > -7.5, "Cascade: each octave is Feedback below the one under it");
      }
      previous = generation;
    }

    // Every voice has its own delay and feedback: each one alone, 200 ms and
    // 25 %, repeats 12 dB down every 200 ms; with no feedback it plays once.
    for (int v = 0; v < 4; ++v) {
      for (float feedback : {25.0f, 0.0f}) {
        solo(device);
        device.set_param(p::kV1Role, kOff);
        device.set_param(voice_param(v, p::kV1Role), kInterval);
        device.set_param(voice_param(v, p::kV1Degrees), 0.0f);
        device.set_param(voice_param(v, p::kV1Level), 0.0f);
        device.set_param(voice_param(v, p::kV1Pan), 0.0f);
        device.set_param(voice_param(v, p::kV1Delay), 200.0f);
        device.set_param(voice_param(v, p::kV1Feedback), feedback);
        out = run(device, burst(440.0f, 0.15f, 1.0f, kRate, 0.5f));
        const double first = rms(out.left, 9600 + 2400, 9600 + 6000);
        const double second = rms(out.left, 19200 + 2400, 19200 + 6000);
        EXPECT(first > 0.1, "each voice has its own delay");
        if (feedback > 0.0f) {
          EXPECT_NEAR(db(second / first), -12.04, 0.3, "each voice has its own feedback");
        } else {
          EXPECT(second < 1.0e-5, "a voice without feedback plays once");
        }
      }
    }

    // Under 5 ms of delay the feedback fades out, so a short delay cannot ring.
    solo(device);
    device.set_param(p::kV1Delay, 1.0f);
    device.set_param(p::kV1Feedback, 90.0f);
    out = run(device, burst(440.0f, 0.2f, 1.0f, kRate, 0.5f));
    show("90 % feedback at 1 ms: level 100 ms after the burst, dB", db(rms(out.left, 14400, 19200)));
    EXPECT(rms(out.left, 14400, 19200) < 1.0e-4, "feedback is faded out at very short delays");
  }

  // --- level and pan per voice --------------------------------------------------------------
  {
    solo(device);
    device.set_param(p::kV1Degrees, 7.0f);
    device.set_param(p::kV1Pan, -100.0f);
    device.set_param(p::kV2Role, kInterval);
    device.set_param(p::kV2Degrees, -12.0f);
    device.set_param(p::kV2Level, -12.0f);
    device.set_param(p::kV2Pan, 100.0f);
    Stereo out = run(device, sine(440.0f, 1.0f, kRate, 0.5f));
    const size_t from = 14400, to = 48000;
    const double left_fifth = tone_level(out.left, 659.2551, kRate, from, to);
    const double right_fifth = tone_level(out.right, 659.2551, kRate, from, to);
    const double left_octave = tone_level(out.left, 220.0, kRate, from, to);
    const double right_octave = tone_level(out.right, 220.0, kRate, from, to);
    show("voice 1 hard left: left level, dB re input", db(left_fifth / 0.5));
    show("voice 2 hard right at -12 dB: right level, dB re input", db(right_octave / 0.5));
    EXPECT_NEAR(db(left_fifth / 0.5), 0.0, 0.5, "a hard-left voice at 0 dB is at full level on the left");
    EXPECT(right_fifth < 1.0e-4, "... and absent on the right");
    EXPECT_NEAR(db(right_octave / 0.5), -12.0, 0.5, "Level -12 dB is 12 dB down, on the right");
    EXPECT(left_octave < 1.0e-4, "... and absent on the left");

    // A centred voice is equal in both channels; -60 dB is off.
    solo(device);
    out = run(device, sine(440.0f, 0.6f, kRate, 0.5f));
    EXPECT_NEAR(rms(out.left, from, 28800) / rms(out.right, from, 28800), 1.0, 0.001, "Pan 0 is centred");
    solo(device);
    device.set_param(p::kV1Level, -60.0f);
    out = run(device, sine(440.0f, 0.6f, kRate, 0.5f));
    EXPECT(peak(out.left) == 0.0 && peak(out.right) == 0.0, "Level -60 dB silences the voice");
    // Voices 3 and 4 have their own controls too.
    solo(device);
    device.set_param(p::kV1Role, kOff);
    device.set_param(p::kV3Role, kInterval);
    device.set_param(p::kV3Degrees, 3.0f);
    device.set_param(p::kV3Pan, -100.0f);
    device.set_param(p::kV3Level, 0.0f);
    device.set_param(p::kV4Role, kInterval);
    device.set_param(p::kV4Degrees, -3.0f);
    device.set_param(p::kV4Pan, 100.0f);
    device.set_param(p::kV4Level, 0.0f);
    out = run(device, sine(440.0f, 1.0f, kRate, 0.5f));
    EXPECT_NEAR(cents_between(settled_frequency(out.left, kRate), note_hz(72.0)), 0.0, 1.0,
                "voice 3: a minor third up, on the left");
    EXPECT_NEAR(cents_between(settled_frequency(out.right, kRate), note_hz(66.0)), 0.0, 1.0,
                "voice 4: a minor third down, on the right");
  }

  // --- glide --------------------------------------------------------------------------------
  {
    // Jump the interval by an octave under a held note and time the pitch:
    // one Glide time takes it 63 % of the way (758 of 1200 cents).
    const auto time_to_63 = [](float glide_ms) {
      solo(device);
      device.set_param(p::kGlide, glide_ms);
      run(device, sine(440.0f, 0.5f, kRate, 0.5f));
      device.set_param(p::kV1Degrees, 12.0f);
      Stereo out = run(device, sine(440.0f, 1.0f, kRate, 0.5f));
      return 1000.0 * time_to_frequency(out.left, kRate, 440.0 * std::pow(2.0, 758.5 / 1200.0)) / kRate;
    };
    const double fast = time_to_63(20.0f);
    const double slow = time_to_63(150.0f);
    const double longest = time_to_63(300.0f);
    const double instant = time_to_63(0.0f);
    show("Glide 20 ms: time to 63 % of an octave jump, ms", fast);
    show("Glide 150 ms", slow);
    show("Glide 300 ms", longest);
    show("Glide 0 ms", instant);
    EXPECT_NEAR(fast, 20.0, 4.0, "Glide 20 ms covers 63 % of a jump in 20 ms");
    EXPECT_NEAR(slow, 150.0, 12.0, "Glide 150 ms covers 63 % of a jump in 150 ms");
    EXPECT_NEAR(longest, 300.0, 24.0, "Glide 300 ms covers 63 % of a jump in 300 ms");
    EXPECT(instant < 3.0, "Glide 0 jumps at once");
  }

  // --- splices ------------------------------------------------------------------------------
  {
    // De-glitch splices a whole number of input periods apart, so a held note
    // comes out as the shifted note and nothing else. Everything that is not
    // a shifted partial is splice artefact (and interpolation error).
    double worst_sine = -200.0, worst_rich = -200.0;
    for (float semitones : {7.0f, -12.0f, 12.0f, 3.0f, -7.0f}) {
      const double ratio = std::pow(2.0, semitones / 12.0);
      for (float hz : {110.0f, 440.0f, 1000.0f}) {
        solo(device);
        device.set_param(p::kV1Degrees, semitones);
        Stereo out = run(device, sine(hz, 1.5f, kRate, 0.5f));
        const double sidebands = residual_db(out.left, {hz * ratio}, kRate, 24000, 72000);
        worst_sine = std::max(worst_sine, sidebands);
        if (verbose()) std::printf("  de-glitch on, %6.1f Hz sine %+3g st: artefacts %.1f dB\n", hz, semitones, sidebands);
      }
      for (float hz : {110.0f, 220.0f, 440.0f}) {
        solo(device);
        device.set_param(p::kV1Degrees, semitones);
        Stereo out = run(device, harmonic_tone(hz, 1.5f, kRate, 0.4f));
        const double sidebands = residual_db(
            out.left, {hz * ratio, 2.0 * hz * ratio, 3.0 * hz * ratio, 4.0 * hz * ratio}, kRate, 24000, 72000);
        worst_rich = std::max(worst_rich, sidebands);
        if (verbose()) std::printf("  de-glitch on, %6.1f Hz harmonic tone %+3g st: artefacts %.1f dB\n", hz, semitones, sidebands);
      }
    }
    show("de-glitch on: worst artefacts under a shifted sine, dB", worst_sine);
    show("de-glitch on: worst artefacts under a shifted harmonic tone, dB", worst_rich);
    EXPECT(worst_sine < -50.0, "splice artefacts stay 50 dB under a shifted sine (110 to 1000 Hz)");
    EXPECT(worst_rich < -50.0, "splice artefacts stay 50 dB under a shifted harmonic tone");

    // Without it the two grains meet at any phase: the strongest line is
    // pulled off the note and the splice sidebands come up.
    solo(device);
    device.set_param(p::kV1Degrees, 7.0f);
    device.set_param(p::kDeglitch, 0.0f);
    Stereo out = run(device, sine(440.0f, 1.5f, kRate, 0.5f));
    const double strongest = strongest_frequency(out.left, kRate, 500.0, 800.0, 24000, 72000);
    const double chopped = residual_db(out.left, {strongest}, kRate, 24000, 72000);
    show("de-glitch off, 440 Hz +7 st: strongest line, Hz (the note is 659.26)", strongest);
    show("de-glitch off: everything else relative to it, dB", chopped);
    EXPECT(chopped > -25.0, "without De-glitch the splices are audible (over -25 dB)");
    EXPECT(chopped > worst_sine + 20.0, "De-glitch buys at least 20 dB");
  }

  // --- splice window ------------------------------------------------------------------------
  {
    // One splice per window: with De-glitch off the splices mark a held tone
    // with spectral lines exactly 1/window apart (and none halfway).
    for (float window_ms : {10.0f, 24.0f, 60.0f}) {
      solo(device);
      device.set_param(p::kV1Degrees, 7.0f);
      device.set_param(p::kDeglitch, 0.0f);
      device.set_param(p::kWindow, window_ms);
      Stereo out = run(device, sine(440.0f, 2.5f, kRate, 0.5f));
      const size_t from = 24000, to = 120000;
      const double spacing = 1000.0 / window_ms;
      const double strongest = strongest_frequency(out.left, kRate, 560.0, 760.0, from, to);
      const double neighbours = tone_level(out.left, strongest + spacing, kRate, from, to) +
                                tone_level(out.left, strongest - spacing, kRate, from, to);
      const double between = tone_level(out.left, strongest + 0.5 * spacing, kRate, from, to) +
                             tone_level(out.left, strongest - 0.5 * spacing, kRate, from, to);
      if (verbose()) {
        std::printf("  window %2.0f ms: lines %.2f Hz either side of %.2f Hz at %.4f, halfway %.5f\n", window_ms,
                    spacing, strongest, neighbours, between);
      }
      EXPECT(std::fabs(strongest - 659.2551) <= 0.5 * spacing + 0.5,
             "an unaligned splice pulls a tone by at most half the splice rate");
      EXPECT(neighbours > 0.02 && between < 0.1 * neighbours, "the splice rate is one per Splice Window");
    }

    // An up-shifted grain starts further behind the input the longer the
    // window (it must last the window without overtaking the input), so the
    // voice answers later.
    const auto answer_ms = [](float window_ms) {
      solo(device);
      device.set_param(p::kV1Degrees, 12.0f);
      device.set_param(p::kWindow, window_ms);
      run(device, sine(440.0f, 0.5f, kRate, 0.5f));   // let the tracker settle on the octave
      run(device, silence(0.5f, kRate));
      Stereo out = run(device, sine(440.0f, 0.5f, kRate, 0.5f));
      return static_cast<double>(onset(out.left, 0.5 * 0.5 * 0.7071)) / 48.0;
    };
    const double short_window = answer_ms(10.0f);
    const double long_window = answer_ms(60.0f);
    show("Window 10 ms: an octave-up voice reaches half level after, ms", short_window);
    show("Window 60 ms", long_window);
    EXPECT(short_window < 15.0, "Window 10 ms answers within 15 ms");
    EXPECT(long_window > short_window + 20.0 && long_window < 125.0, "a longer Splice Window answers later");
  }

  // --- mix and output -----------------------------------------------------------------------
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> left = sine(440.0f, 0.5f, kRate, 0.5f);
    std::vector<float> right = sine(557.0f, 0.5f, kRate, 0.4f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 is the stereo input, bit for bit");

    solo(device);
    device.set_param(p::kV1Degrees, 12.0f);
    out = run(device, left, right);
    EXPECT(tone_level(out.left, 440.0, kRate, 14400, 24000) < 1.0e-3 &&
               tone_level(out.right, 557.0, kRate, 14400, 24000) < 1.0e-3,
           "Mix 100 has no dry signal");

    // Mix 50: the dry at half level plus the voices at half level.
    solo(device);
    device.set_param(p::kV1Degrees, 12.0f);
    device.set_param(p::kMix, 50.0f);
    out = run(device, sine(440.0f, 1.0f, kRate, 0.5f));
    EXPECT_NEAR(tone_level(out.left, 440.0, kRate, 14400, 48000), 0.25, 0.005, "Mix 50 halves the dry signal");
    EXPECT_NEAR(tone_level(out.left, 880.0, kRate, 14400, 48000), 0.25 * 0.7071, 0.005,
                "Mix 50 halves the voices");

    device.set_param(p::kOutput, 6.0f);
    Stereo louder = run(device, sine(440.0f, 1.0f, kRate, 0.5f));
    EXPECT_NEAR(db(rms(louder.left, 24000, 48000) / rms(out.left, 24000, 48000)), 6.0, 0.1,
                "Output +6 dB is 6 dB louder");
    device.set_param(p::kOutput, -24.0f);
    Stereo softer = run(device, sine(440.0f, 1.0f, kRate, 0.5f));
    EXPECT_NEAR(db(rms(softer.left, 24000, 48000) / rms(out.left, 24000, 48000)), -24.0, 0.1,
                "Output -24 dB is 24 dB quieter");
  }

  // --- custom scales ------------------------------------------------------------------------
  {
    // A scale of two notes, the root and one custom degree: one step up from C
    // is that many cents. Every slot and its cents value is reached this way.
    for (int slot = 1; slot < 12; ++slot) {
      const float cents = 100.0f * slot + 37.0f;  // off the 12-tone grid on purpose
      const double hz = voiced_output(static_cast<float>(note_hz(60.0)), [slot, cents](Lattice& d) {
        d.set_param(p::kScale, kCustom);
        for (int other = 0; other < 12; ++other) d.set_param(p::kCustomOn1 + 2 * other, other == 0 ? 1.0f : 0.0f);
        d.set_param(p::kCustomOn1 + 2 * slot, 1.0f);
        d.set_param(p::kCustomCents1 + 2 * slot, cents);
        d.set_param(p::kV1Degrees, 1.0f);
      });
      char label[96];
      std::snprintf(label, sizeof label, "custom degree %d at %.0f ct: one step above C4", slot + 1, cents);
      show(label, cents_between(hz, note_hz(60.0)));
      EXPECT_NEAR(cents_between(hz, note_hz(60.0)), cents, 1.0, label);
    }
    // Slot 1 moved to 50 ct with slot 8 (700 ct): C4 + 50 ct is a degree, one step up is 650 ct more.
    const double first = voiced_output(static_cast<float>(note_hz(60.5)), [](Lattice& d) {
      d.set_param(p::kScale, kCustom);
      for (int other = 0; other < 12; ++other) d.set_param(p::kCustomOn1 + 2 * other, 0.0f);
      d.set_param(p::kCustomOn1, 1.0f);
      d.set_param(p::kCustomCents1, 50.0f);
      d.set_param(p::kCustomOn8, 1.0f);
      d.set_param(p::kV1Degrees, 1.0f);
    });
    EXPECT_NEAR(cents_between(first, note_hz(60.5)), 650.0, 1.0, "custom degree 1 takes its cents value too");

    // The period need not be an octave: one degree per 700 ct is a ladder of fifths.
    const auto ladder = [](float period, float steps) {
      return voiced_output(static_cast<float>(note_hz(60.0)), [period, steps](Lattice& d) {
        d.set_param(p::kScale, kCustom);
        for (int other = 1; other < 12; ++other) d.set_param(p::kCustomOn1 + 2 * other, 0.0f);
        d.set_param(p::kCustomPeriod, period);
        d.set_param(p::kV1Degrees, steps);
      });
    };
    EXPECT_NEAR(cents_between(ladder(1200.0f, 1.0f), note_hz(60.0)), 1200.0, 1.0,
                "a one-note scale with a 1200 ct period steps in octaves");
    EXPECT_NEAR(cents_between(ladder(700.0f, 1.0f), note_hz(60.0)), 700.0, 1.0,
                "Custom Period 700 ct steps in fifths");
    EXPECT_NEAR(cents_between(ladder(700.0f, -2.0f), note_hz(60.0)), -1400.0, 1.0,
                "... two steps down is two fifths down");
    // With the scale not on Custom the custom controls do nothing.
    const double ignored = voiced_output(static_cast<float>(note_hz(60.0)), [](Lattice& d) {
      d.set_param(p::kScale, kMajor);
      d.set_param(p::kCustomPeriod, 700.0f);
      d.set_param(p::kCustomCents3, 137.0f);
      d.set_param(p::kV1Degrees, 1.0f);
    });
    EXPECT_NEAR(cents_between(ignored, note_hz(62.0)), 0.0, 1.0, "preset scales ignore the custom degrees");
  }

  // --- no clicks ----------------------------------------------------------------------------
  {
    // A 440 Hz sine at 0.5 shifted up an octave moves at most 0.5*0.707*2*pi*880/48000 = 0.041 per sample.
    solo(device);
    run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    device.set_param(p::kV1Degrees, 12.0f);
    Stereo out = run(device, sine(440.0f, 0.3f, kRate, 0.5f));
    device.set_param(p::kV1Degrees, -12.0f);
    out = concat(out, run(device, sine(440.0f, 0.3f, kRate, 0.5f)));
    show("interval jumps under a held note: largest step", max_step(out.left));
    EXPECT(max_step(out.left) < 0.05, "changing a voice's interval glides without a click");

    // Level, pan, mix and a voice switched on and off under a held note.
    solo(device);
    device.set_param(p::kV1Degrees, 7.0f);
    run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    Stereo moved;
    const float steps[][2] = {{p::kV1Level, -20.0f}, {p::kV1Pan, 100.0f},  {p::kV1Pan, -100.0f},
                              {p::kV1Level, 6.0f},   {p::kMix, 20.0f},     {p::kMix, 100.0f},
                              {p::kV1Role, kOff},    {p::kV1Role, kMirror}, {p::kV2Role, kInterval},
                              {p::kOutput, -12.0f},  {p::kOutput, 0.0f},   {p::kFeedbackPath, 1.0f},
                              {p::kScale, kMajor},   {p::kRoot, 4.0f},     {p::kCenter, 50.0f}};
    double worst_step = 0.0;
    for (const auto& step : steps) {
      device.set_param(static_cast<int>(step[0]), step[1]);
      moved = run(device, sine(440.0f, 0.1f, kRate, 0.5f));
      worst_step = std::max(worst_step, std::max(max_step(moved.left), max_step(moved.right)));
    }
    show("level, pan, mix, role, output, scale moved under a note: largest step", worst_step);
    // Two voices at up to +6 dB: the signal itself can move 0.12 per sample.
    EXPECT(worst_step < 0.15, "level, pan, mix, role, output and scale changes do not click");

    // A delay time moved while sounding is ramped over 5 ms: a short scrub, not a jump.
    solo(device);
    device.set_param(p::kV1Delay, 100.0f);
    run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    device.set_param(p::kV1Delay, 130.0f);
    moved = run(device, sine(440.0f, 0.2f, kRate, 0.5f));
    show("delay time moved under a note: largest step", max_step(moved.left));
    EXPECT(max_step(moved.left) < 0.15, "a Delay change scrubs instead of jumping");
  }

  // --- a voice switched on mid-note ---------------------------------------------------------
  {
    solo(device);
    device.set_param(p::kV1Degrees, 7.0f);
    device.set_param(p::kV1Pan, -100.0f);
    run(device, sine(440.0f, 1.0f, kRate, 0.5f));
    device.set_param(p::kV2Role, kInterval);
    device.set_param(p::kV2Degrees, -12.0f);
    device.set_param(p::kV2Level, 0.0f);
    device.set_param(p::kV2Pan, 100.0f);
    Stereo out = run(device, sine(440.0f, 0.6f, kRate, 0.5f));
    EXPECT_NEAR(tone_level(out.right, 220.0, kRate, 4800, 28800), 0.5, 0.01,
                "a voice switched on under a held note is there within 100 ms, at pitch");
    show("a voice switched on under a note: largest step", max_step(out.right));
    // It glides in from unison, so it can move as fast as the 440 Hz input does.
    EXPECT(max_step(out.right) < 0.5 * 2.0 * kPi * 440.0 / kRate * 1.2, "... and enters without a click");
    // Switched off, its delay line is emptied: nothing old comes back with it.
    device.set_param(p::kV2Delay, 400.0f);
    device.set_param(p::kV2Feedback, 80.0f);
    run(device, sine(440.0f, 1.0f, kRate, 0.5f));
    device.set_param(p::kV2Role, kOff);
    run(device, silence(0.2f, kRate));
    device.set_param(p::kV2Role, kInterval);
    out = run(device, silence(1.0f, kRate));
    show("voice 2 back on after Off: what is left of its old echoes", peak(out.right));
    EXPECT(peak(out.right, 480, 48000) < 1.0e-3, "a voice that was switched off comes back without old echoes");
  }

  // --- blocks -------------------------------------------------------------------------------
  {
    // The tracker's hop is counted in samples: a tracked melody renders the
    // same in 128-frame, 1-frame-ish ragged and 2048-frame blocks.
    std::vector<float> melody = harmonic_tone(220.0f, 0.4f, kRate, 0.4f);
    const std::vector<float> second = harmonic_tone(329.63f, 0.4f, kRate, 0.4f);
    const std::vector<float> third = harmonic_tone(196.0f, 0.4f, kRate, 0.4f);
    melody.insert(melody.end(), second.begin(), second.end());
    melody.insert(melody.end(), third.begin(), third.end());
    const auto render_in = [&melody](int block, float path) {
      device.init(kRate);
      device.set_param(p::kV3Delay, 120.0f);
      device.set_param(p::kV3Feedback, 40.0f);
      device.set_param(p::kFeedbackPath, path);
      return run(device, melody, block);
    };
    double worst = 0.0;
    Stereo reference;
    for (float path : {1.0f, 0.0f}) {
      reference = render_in(128, path);
      for (int block : {1, 37, 256, 2048}) {
        const Stereo other = render_in(block, path);
        for (size_t i = 0; i < melody.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(other.left[i]) - reference.left[i]));
          worst = std::max(worst, std::fabs(static_cast<double>(other.right[i]) - reference.right[i]));
        }
      }
    }
    show("tracked melody in 1/37/256/2048-frame blocks: max difference", worst);
    EXPECT(worst == 0.0, "a tracked melody renders identically at every block size");
    EXPECT(rms(reference.left) > 0.05, "... and the default patch sounds");
  }

  // --- other sample rates -------------------------------------------------------------------
  {
    for (float rate : {44100.0f, 96000.0f}) {
      solo(device, rate);
      device.set_param(p::kV1Degrees, 7.0f);
      device.set_param(p::kV1Delay, 250.0f);
      Stereo out = run(device, burst(440.0f, 0.5f, 1.0f, rate, 0.5f));
      const size_t from = static_cast<size_t>(0.4f * rate), to = static_cast<size_t>(0.7f * rate);
      const double hz = strongest_frequency(out.left, rate, 300.0, 2000.0, from, to);
      const double arrives = static_cast<double>(onset(out.left, 0.05)) / rate;
      if (verbose()) std::printf("  at %.0f Hz: +7 st gives %.2f Hz, a 250 ms delay arrives at %.1f ms\n", rate, hz, arrives * 1000.0);
      EXPECT_NEAR(cents_between(hz, 659.2551), 0.0, 1.0, "the shift is the same at 44.1 and 96 kHz");
      EXPECT_NEAR(arrives, 0.2535, 0.003, "delay times are in milliseconds at any sample rate");
    }
    // Two octaves up with the longest window at 96 kHz: the widest reach of a grain.
    solo(device, 96000.0f);
    device.set_param(p::kScale, kMajor);
    device.set_param(p::kV1Degrees, 14.0f);
    device.set_param(p::kWindow, 60.0f);
    Stereo out = run(device, sine(440.0f, 1.5f, 96000.0f, 0.5f));
    const double hz = strongest_frequency(out.left, 96000.0, 300.0, 4000.0, 72000, 144000);
    const double artefacts = residual_db(out.left, {1760.0}, 96000.0f, 72000, 144000);
    show("96 kHz, +2 octaves, 60 ms window: artefacts, dB", artefacts);
    EXPECT_NEAR(cents_between(hz, 1760.0), 0.0, 1.0, "two octaves up with a 60 ms window holds at 96 kHz");
    EXPECT(artefacts < -45.0, "... and stays clean");
  }

  // --- bounded, and asleep after the tail ---------------------------------------------------
  {
    // The loudest loop: four voices in Cascade at 90 %, long delays, an octave up.
    device.init(kRate);
    device.set_param(p::kScale, kChromatic);
    device.set_param(p::kFeedbackPath, 1.0f);
    device.set_param(p::kMix, 100.0f);
    for (int v = 0; v < 4; ++v) {
      device.set_param(voice_param(v, p::kV1Role), kInterval);
      device.set_param(voice_param(v, p::kV1Degrees), v % 2 == 0 ? 12.0f : -12.0f);
      device.set_param(voice_param(v, p::kV1Level), 0.0f);
      device.set_param(voice_param(v, p::kV1Delay), 60.0f + 110.0f * v);
      device.set_param(voice_param(v, p::kV1Feedback), 90.0f);
    }
    rng_state() = 0xFACEu;
    std::vector<float> loud = harmonic_tone(220.0f, 6.0f, kRate, 0.9f);
    const std::vector<float> hiss = noise(6.0f, kRate, 0.9f);
    loud.insert(loud.end(), hiss.begin(), hiss.end());
    Stereo out = run(device, loud);
    show("four cascades at 90 % under 12 s of full-scale input: peak", std::max(peak(out.left), peak(out.right)));
    EXPECT(finite(out.left) && finite(out.right), "four cascades at 90 % stay finite");
    EXPECT(peak(out.left) <= 8.0 && peak(out.right) <= 8.0, "... and under the output ceiling");
    Stereo tail = render(device, 60.0f, kRate);
    show("... level 60 s after the input stops, dB", db(rms(tail.left, tail.size() - 48000, tail.size())));
    EXPECT(rms(tail.left, tail.size() - 48000, tail.size()) < rms(out.left) * 1.0e-3, "... and die away");

    // Echoes at 50 % and 300 ms: 6 dB per repeat, asleep (exact zero) within 10 s.
    solo(device);
    device.set_param(p::kV1Degrees, 7.0f);
    device.set_param(p::kV1Delay, 300.0f);
    device.set_param(p::kV1Feedback, 50.0f);
    run(device, burst(440.0f, 0.2f, 0.5f, kRate, 0.5f));
    Stereo ringing = render(device, 1.0f, kRate);
    EXPECT(peak(ringing.left) > 0.01, "the echoes ring on after the input stops");
    render(device, 9.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, burst(440.0f, 0.2f, 0.5f, kRate, 0.5f));
    EXPECT(peak(woken.left, 14400, 24000) > 0.1, "wakes on new input");
    EXPECT_NEAR(cents_between(strongest_frequency(woken.left, kRate, 300.0, 2000.0, 16800, 24000), 659.2551), 0.0,
                5.0, "... still a fifth up");

    // The gate listens to the voices, not only the output: with Mix at 0 the
    // output is silent, but a ringing tail keeps running and is where it
    // should be when Mix comes back.
    const auto tail_after = [](float mix_while_ringing) {
      solo(device);
      device.set_param(p::kV1Degrees, 7.0f);
      device.set_param(p::kV1Delay, 400.0f);
      device.set_param(p::kV1Feedback, 80.0f);
      device.set_param(p::kMix, mix_while_ringing);
      run(device, burst(440.0f, 0.2f, 3.0f, kRate, 0.5f));
      device.set_param(p::kMix, 100.0f);
      return render(device, 1.0f, kRate);
    };
    const Stereo heard = tail_after(100.0f);
    const Stereo hidden = tail_after(0.0f);
    double difference = 0.0;
    for (size_t i = 480; i < heard.size(); ++i) {
      difference = std::max(difference, std::fabs(static_cast<double>(heard.left[i]) - hidden.left[i]));
    }
    show("tail after 3 s behind Mix 0: peak", peak(hidden.left));
    EXPECT(peak(heard.left) > 0.02 && difference < 1.0e-6, "a tail hidden by Mix 0 keeps running");
  }

  // --- cost ---------------------------------------------------------------------------------
  {
    // A played line (the tracker and three voices at work) at the default patch.
    std::vector<float> line;
    for (float hz : {220.0f, 246.94f, 261.63f, 329.63f, 293.66f, 196.0f, 220.0f, 261.63f, 329.63f, 440.0f}) {
      const std::vector<float> note = harmonic_tone(hz, 1.0f, kRate, 0.3f);
      line.insert(line.end(), note.begin(), note.end());
    }
    device.init(kRate);
    report_cost("lattice", 10.0f, kRate, [&] { run(device, line); });

    // The worst single block: the best of five passes per block, so scheduler noise drops out.
    const size_t blocks = line.size() / kBlock;
    std::vector<double> best(blocks, 1.0e9);
    for (int pass = 0; pass < 5; ++pass) {
      device.init(kRate);
      for (size_t b = 0; b < blocks; ++b) {
        for (int i = 0; i < kBlock; ++i) {
          device.in_left()[i] = line[b * kBlock + i];
          device.in_right()[i] = line[b * kBlock + i];
        }
        const auto start = std::chrono::steady_clock::now();
        device.process(kBlock);
        const double micros =
            std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count();
        best[b] = std::min(best[b], micros);
      }
    }
    double total = 0.0, worst = 0.0;
    for (double micros : best) {
      total += micros;
      worst = std::max(worst, micros);
    }
    const double budget = 1.0e6 * kBlock / kRate;
    std::printf("lattice blocks: mean %.1f us, worst %.1f us per 128-frame block (%.2f%% and %.2f%% of real time, native)\n",
                total / blocks, worst, 100.0 * total / blocks / budget, 100.0 * worst / budget);
  }

  return finish("lattice");
}
