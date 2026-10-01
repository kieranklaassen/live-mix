// Native harness for Thesis (cpp/devices/thesis). The conformance pass covers
// stability, silence when idle, note abuse and parameter abuse; the rest
// asserts what makes it Thesis: every note is a small chord of noise bands
// whose pitches are the played note and its reflections around a centre.
//
// Two facts make the measurements exact rather than statistical. Every band
// hears the same noise, and that noise starts from the same seed after
// init(), so two renders that differ in one setting can be compared sample by
// sample: the quotient of a slow and a fast attack is the envelope itself,
// and sqrt(2) x (original + one partial) minus (original alone) is that one
// partial alone.

#include <complex>
#include <functional>

#include "../devices/thesis/thesis.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Thesis;
namespace p = livemix::thesis;

static Thesis device;

static const float kRate = 48000.0f;
static const int kAllOff = 0;
static const int kAllOn = 31;

static size_t at(float seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

static double note_hz(int midi) { return 440.0 * std::pow(2.0, (midi - 69) / 12.0); }

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

// Averaged power spectrum of x[from, to): Hann windows of n samples, half
// overlapped.
struct Spectrum {
  std::vector<double> power;
  double bin_hz = 1.0;

  double band(double lo, double hi) const {
    double sum = 0.0;
    for (size_t i = 0; i < power.size(); ++i) {
      const double hz = static_cast<double>(i) * bin_hz;
      if (hz >= lo && hz <= hi) sum += power[i];
    }
    return sum;
  }
  double centroid(double lo, double hi) const {
    double weighted = 0.0, sum = 0.0;
    for (size_t i = 0; i < power.size(); ++i) {
      const double hz = static_cast<double>(i) * bin_hz;
      if (hz < lo || hz > hi) continue;
      weighted += hz * power[i];
      sum += power[i];
    }
    return sum > 0.0 ? weighted / sum : 0.0;
  }
  // Centre of the strongest band: the loudest bin, then the centroid of the
  // 3 % either side of it, twice.
  double peak_hz() const {
    size_t best = 1;
    for (size_t i = 1; i + 1 < power.size(); ++i) {
      if (power[i - 1] + power[i] + power[i + 1] > power[best - 1] + power[best] + power[best + 1]) best = i;
    }
    double hz = static_cast<double>(best) * bin_hz;
    for (int pass = 0; pass < 2; ++pass) hz = centroid(hz * 0.97, hz * 1.03);
    return hz;
  }
};

static Spectrum spectrum(const std::vector<float>& x, double rate, size_t from, size_t to, size_t n = 32768) {
  Spectrum out;
  out.power.assign(n / 2, 0.0);
  out.bin_hz = rate / static_cast<double>(n);
  to = std::min(to, x.size());
  std::vector<std::complex<double>> bins(n);
  for (size_t start = from; start + n <= to; start += n / 2) {
    for (size_t i = 0; i < n; ++i) {
      const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
      bins[i] = w * x[start + i];
    }
    fft(bins);
    for (size_t i = 0; i < n / 2; ++i) out.power[i] += std::norm(bins[i]);
  }
  return out;
}

// Fixed mode, a 10 ms attack and no switches on: the bare original partial.
static void plain(Thesis& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMode, 0.0f);
  d.set_param(p::kAttack, 0.01f);
  for (int k = 0; k < 5; ++k) d.set_param(p::kMirrorEnabled + k, 0.0f);
}

// Bit k of `mask` turns partial k + 1 on (mirror, octaflip, middle, mirror
// middle, centre).
static void switches(Thesis& d, int mask) {
  for (int k = 0; k < 5; ++k) d.set_param(p::kMirrorEnabled + k, (mask >> k) & 1 ? 1.0f : 0.0f);
}

using Setup = std::function<void(Thesis&)>;

// One note at full gain for `seconds` after plain() and `setup`.
static Stereo play(const Setup& setup, int mask, float hz, float seconds, float rate = kRate, int block = kBlock) {
  plain(device, rate);
  if (setup) setup(device);
  switches(device, mask);
  device.note_on(1, hz, 1.0f);
  return render(device, seconds, rate, block);
}

// Partial `index` of a note on its own (0 is the original). Needs a mode
// that treats the original the same with and without company.
static std::vector<float> partial_alone(const Setup& setup, int index, float hz, float seconds,
                                        float rate = kRate) {
  Stereo alone = play(setup, kAllOff, hz, seconds, rate);
  if (index == 0) return alone.left;
  Stereo pair = play(setup, 1 << (index - 1), hz, seconds, rate);
  std::vector<float> out(alone.left.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 1.41421356f * pair.left[i] - alone.left[i];
  return out;
}

// Mean |a| over mean |b| in the 10 ms around `seconds`.
static double level_ratio(const std::vector<float>& a, const std::vector<float>& b, float seconds,
                          float rate = kRate) {
  const size_t half = at(0.005f, rate);
  const size_t centre = at(seconds, rate);
  double top = 0.0, bottom = 0.0;
  for (size_t i = centre - half; i < centre + half && i < a.size() && i < b.size(); ++i) {
    top += std::fabs(a[i]);
    bottom += std::fabs(b[i]);
  }
  return top / std::max(bottom, 1.0e-30);
}

static double max_difference(const std::vector<float>& a, const std::vector<float>& b, size_t from = 0,
                             size_t to = SIZE_MAX) {
  double worst = 0.0;
  to = std::min(to, std::min(a.size(), b.size()));
  for (size_t i = from; i < to; ++i) worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - b[i]));
  return worst;
}

static size_t first_difference(const std::vector<float>& a, const std::vector<float>& b) {
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    if (a[i] != b[i]) return i;
  }
  return SIZE_MAX;
}

// The chord of one note: six isolated partials against six expected pitches.
static void expect_chord(const char* name, const Setup& setup, int played_midi, const int expected_midi[6],
                         double ratio = 1.0) {
  static const char* const kNames[6] = {"original", "mirror", "octaflip", "middle", "mirror middle", "centre"};
  for (int i = 0; i < 6; ++i) {
    const std::vector<float> partial =
        partial_alone(setup, i, static_cast<float>(note_hz(played_midi)), 8.0f);
    const Spectrum s = spectrum(partial, kRate, at(0.5f), partial.size());
    const double want = note_hz(expected_midi[i]) * ratio;
    const double got = s.peak_hz();
    char label[200];
    std::snprintf(label, sizeof label, "%s: the %s band sits on MIDI %d (%.2f Hz, measured %.2f)", name,
                  kNames[i], expected_midi[i], want, got);
    EXPECT(std::fabs(got - want) < 0.01 * want, label);
    // And it is a band, not a wash: most of its power lies within 3 %.
    std::snprintf(label, sizeof label, "%s: the %s partial is one narrow band", name, kNames[i]);
    EXPECT(s.band(want * 0.97, want * 1.03) > 0.6 * s.band(20.0, 20000.0), label);
  }
}

int main() {
  Conformance spec{"thesis", p::kNumParams, p::kParamMin, p::kParamMax, p::kParamDefault};
  spec.tail_seconds = 2.5f;  // the 2 s release, then the idle gate
  spec.max_peak = 1.01f;
  check_instrument(device, spec);

  const Setup sharp = [](Thesis& d) { d.set_param(p::kResonance, 50.0f); };

  // The parameters the original test suite pins.
  {
    EXPECT(p::kParamMin[p::kCenter] == 48.0f && p::kParamMax[p::kCenter] == 71.0f &&
               p::kParamDefault[p::kCenter] == 62.0f,
           "Center runs from 48 to 71 and starts on 62");
    EXPECT(p::kParamMax[p::kMode] == 3.0f, "Mode has four choices");
    EXPECT(p::kParamMax[p::kScale] == 12.0f, "Scale has thirteen choices");
    EXPECT(p::kParamMax[p::kRoot] == 11.0f, "Root has twelve choices");
    EXPECT(p::kParamDefault[p::kMirrorEnabled] == 1.0f, "Mirror is on by default");
  }

  // The original render test: note 62 for 0.6 s with a 10 ms attack sounds
  // on both channels.
  {
    device.init(kRate);
    device.set_param(p::kAttack, 0.01f);
    device.note_on(62, static_cast<float>(note_hz(62)), 0.8f);
    Stereo held = render(device, 0.6f, kRate);
    device.note_off(62);
    Stereo out = concat(held, render(device, 0.4f, kRate));
    EXPECT(peak(out.left) > 0.001 && peak(out.right) > 0.001, "a note sounds on both channels");
    EXPECT(finite(out.left) && finite(out.right), "and is finite");
  }

  // The chord of a note: six bands on the transform's six pitches.
  {
    // C major around D4. A4 is four degrees above the centre, so the mirror
    // is four below (G3), the octaflip an octave towards the centre (A3),
    // the middle two above (F4) and its mirror two below (B3).
    const int major[6] = {69, 55, 57, 65, 59, 62};
    expect_chord("C major, centre D4, A4", sharp, 69, major);

    // A natural minor around C4. E5 is nine degrees up: mirror A2, octaflip
    // E4, middle four up (G4), its mirror four down (F3).
    const Setup minor_setup = [](Thesis& d) {
      d.set_param(p::kResonance, 50.0f);
      d.set_param(p::kScale, 1.0f);
      d.set_param(p::kRoot, 9.0f);
      d.set_param(p::kCenter, 60.0f);
    };
    const int minor[6] = {76, 45, 64, 67, 53, 60};
    expect_chord("A minor, centre C4, E5", minor_setup, 76, minor);

    // C pentatonic around E4: an octave is five degrees here. D3 is six
    // degrees down: mirror G5, octaflip D4, middle A3, its mirror C5.
    const Setup pentatonic_setup = [](Thesis& d) {
      d.set_param(p::kResonance, 50.0f);
      d.set_param(p::kCenter, 64.0f);
      d.set_param(p::kScale, 9.0f);
    };
    const int pentatonic[6] = {50, 79, 62, 57, 72, 64};
    expect_chord("C pentatonic, centre E4, D3", pentatonic_setup, 50, pentatonic);

    // D Lydian (D E F# G# A B C#) around B4, played from F#3, ten degrees
    // down: mirror E6, octaflip F#4, middle D4 (five down), its mirror G#5.
    const Setup lydian_setup = [](Thesis& d) {
      d.set_param(p::kResonance, 50.0f);
      d.set_param(p::kScale, 6.0f);
      d.set_param(p::kRoot, 2.0f);
      d.set_param(p::kCenter, 71.0f);
    };
    const int lydian[6] = {54, 88, 66, 62, 80, 71};
    expect_chord("D Lydian, centre B4, F#3", lydian_setup, 54, lydian);

    // The device asks the same transform: its six answers for the first
    // setting are the pitches above.
    ThesisTransform transform;
    const ThesisTransform::VoiceFrequencies f = transform.transform(69);
    EXPECT_NEAR(f.mirror, note_hz(55), 0.01, "the transform mirrors A4 to G3 around D4");
    EXPECT_NEAR(f.mirrorMiddle, note_hz(59), 0.01, "and puts the mirrored middle on B3");
  }

  // Notes snap to the scale, and the note is read from the frequency.
  {
    const std::vector<float> off_scale = partial_alone(sharp, 0, static_cast<float>(note_hz(61)), 6.0f);
    const double snapped = spectrum(off_scale, kRate, at(0.5f), off_scale.size()).peak_hz();
    EXPECT_NEAR(snapped, note_hz(60), 0.01 * note_hz(60), "C#4 in C major sounds as C4");

    const Setup chromatic = [](Thesis& d) {
      d.set_param(p::kResonance, 50.0f);
      d.set_param(p::kScale, 12.0f);
    };
    const std::vector<float> kept = partial_alone(chromatic, 0, static_cast<float>(note_hz(61)), 6.0f);
    const double exact = spectrum(kept, kRate, at(0.5f), kept.size()).peak_hz();
    EXPECT_NEAR(exact, note_hz(61), 0.01 * note_hz(61), "and as itself in the chromatic scale");

    Stereo in_tune = play(sharp, kAllOn, 440.0f, 0.5f);
    Stereo sharp_note = play(sharp, kAllOn, 449.0f, 0.5f);
    Stereo flat_note = play(sharp, kAllOn, 431.0f, 0.5f);
    EXPECT(in_tune.left == sharp_note.left && in_tune.left == flat_note.left,
           "431 Hz and 449 Hz are still A4: the chord is identical");
  }

  // Each switch adds exactly its partial; the original cannot be removed.
  {
    const int chord[6] = {69, 55, 57, 65, 59, 62};
    Stereo bare = play(sharp, kAllOff, 440.0f, 6.0f);
    const Spectrum without = spectrum(bare.left, kRate, at(0.5f), bare.left.size());
    EXPECT_NEAR(without.peak_hz(), 440.0, 4.4, "with every switch off the original still sounds");
    static const char* const kNames[5] = {"Mirror", "Octaflip", "Middle", "Mirror Middle", "Center"};
    for (int k = 0; k < 5; ++k) {
      Stereo with_k = play(sharp, 1 << k, 440.0f, 6.0f);
      const Spectrum with = spectrum(with_k.left, kRate, at(0.5f), with_k.left.size());
      // How much each of the five pitches gains, in dB. The new band's skirts
      // lift its neighbours a little; its own pitch gains far more.
      double own = 0.0, others = -100.0;
      for (int other = 1; other < 6; ++other) {
        const double hz = note_hz(chord[other]);
        const double gain =
            10.0 * std::log10(with.band(hz * 0.99, hz * 1.01) / without.band(hz * 0.99, hz * 1.01));
        if (other == k + 1) {
          own = gain;
        } else {
          others = std::max(others, gain);
        }
      }
      char label[160];
      std::snprintf(label, sizeof label, "%s adds its own band (%.1f dB there, at most %.1f dB elsewhere)",
                    kNames[k], own, others);
      EXPECT(own > 20.0 && own > others + 12.0, label);
    }
  }

  // Resonance narrows the bands.
  {
    auto with_q = [](float q) {
      return [q](Thesis& d) { d.set_param(p::kResonance, q); };
    };
    double share[3], prominence[3], level[3];
    const float qs[3] = {5.0f, 20.0f, 50.0f};
    for (int i = 0; i < 3; ++i) {
      Stereo out = play(with_q(qs[i]), kAllOff, 440.0f, 10.0f);
      const Spectrum s = spectrum(out.left, kRate, at(0.5f), out.left.size());
      share[i] = s.band(440.0 * 0.99, 440.0 * 1.01) / s.band(20.0, 20000.0);
      // Peak against the skirt an octave up, per hertz.
      prominence[i] = 10.0 * std::log10((s.band(438.0, 442.0) / 4.0) / (s.band(840.0, 920.0) / 80.0));
      level[i] = rms(out.left, at(0.5f));
    }
    char label[200];
    std::snprintf(label, sizeof label, "share of the power within 1 %% of the pitch: %.2f, %.2f, %.2f",
                  share[0], share[1], share[2]);
    EXPECT(share[0] < 0.12 && share[1] > 0.17 && share[1] < 0.33 && share[2] > 0.4, label);
    std::snprintf(label, sizeof label, "peak over the skirt an octave up: %.1f, %.1f, %.1f dB",
                  prominence[0], prominence[1], prominence[2]);
    EXPECT(prominence[0] > 12.0 && prominence[0] < 20.0 && prominence[1] > prominence[0] + 9.0 &&
               prominence[2] > prominence[1] + 5.0 && prominence[2] > 31.0,
           label);
    // A constant-Q noise band grows with sqrt(Q); the 1 / (Q / 10) scaling
    // takes more than that back above Q 10.
    std::snprintf(label, sizeof label, "level at Q 5, 20, 50: %.4f, %.4f, %.4f", level[0], level[1], level[2]);
    EXPECT(level[1] > 0.6 * level[0] && level[1] < 1.4 * level[0] && level[2] < 0.75 * level[1], label);

    Stereo clamped = play(with_q(50.0f), kAllOn, 440.0f, 1.0f);
    Stereo beyond = play(with_q(100.0f), kAllOn, 440.0f, 1.0f);
    EXPECT(clamped.left == beyond.left, "Resonance above 50 holds at 50, as in the plugin");
  }

  // Strum: partial i enters i x Strum after the note, to the sample.
  {
    const Setup strummed = [](Thesis& d) { d.set_param(p::kStrum, 100.0f); };
    Stereo bare = play(strummed, kAllOff, 440.0f, 1.0f);
    bool in_order = true;
    for (int k = 1; k <= 5; ++k) {
      Stereo with_k = play(strummed, 1 << (k - 1), 440.0f, 1.0f);
      const size_t entry = first_difference(with_k.left, bare.left);
      if (entry != static_cast<size_t>(4800 * k)) in_order = false;
      char label[160];
      std::snprintf(label, sizeof label, "Strum 100 ms: partial %d enters at %d ms (measured %.2f ms)", k,
                    100 * k, entry == SIZE_MAX ? -1.0 : 1000.0 * static_cast<double>(entry) / kRate);
      EXPECT(entry == static_cast<size_t>(4800 * k), label);
    }
    EXPECT(in_order, "the partials enter in order");

    const Setup short_strum = [](Thesis& d) { d.set_param(p::kStrum, 20.0f); };
    Stereo bare_short = play(short_strum, kAllOff, 440.0f, 0.5f);
    Stereo late = play(short_strum, 16, 440.0f, 0.5f);
    EXPECT(first_difference(late.left, bare_short.left) == 4800, "Strum 20 ms: the fifth enters at 100 ms");

    Stereo together = play(nullptr, 16, 440.0f, 0.5f);
    Stereo bare_now = play(nullptr, kAllOff, 440.0f, 0.5f);
    EXPECT(first_difference(together.left, bare_now.left) == 0, "Strum 0: everything starts at once");

    // The whole chord, heard: the centre's band is absent for half a second.
    const Setup strummed_sharp = [](Thesis& d) {
      d.set_param(p::kStrum, 100.0f);
      d.set_param(p::kResonance, 20.0f);
    };
    Stereo chord = play(strummed_sharp, kAllOn, 880.0f, 1.5f);
    const double centre = note_hz(62);
    const double before = tone_level(chord.left, centre, kRate, at(0.1f), at(0.45f));
    const double after = tone_level(chord.left, centre, kRate, at(0.9f), at(1.4f));
    EXPECT(after > 10.0 * before, "the last partial is not heard before its turn");
  }

  // Attack and release are straight lines of the set length.
  {
    const Setup broad = [](Thesis& d) { d.set_param(p::kResonance, 5.0f); };
    Stereo fast = play(broad, kAllOff, 440.0f, 1.0f);
    const Setup slow_attack = [](Thesis& d) {
      d.set_param(p::kResonance, 5.0f);
      d.set_param(p::kAttack, 0.5f);
    };
    Stereo slow = play(slow_attack, kAllOff, 440.0f, 1.0f);
    EXPECT_NEAR(level_ratio(slow.left, fast.left, 0.125f), 0.25, 0.01, "Attack 0.5 s: a quarter up at 125 ms");
    EXPECT_NEAR(level_ratio(slow.left, fast.left, 0.25f), 0.5, 0.01, "half up at 250 ms");
    EXPECT_NEAR(level_ratio(slow.left, fast.left, 0.45f), 0.9, 0.01, "nine tenths at 450 ms");
    EXPECT(level_ratio(slow.left, fast.left, 0.495f) < 0.995, "not yet up at 495 ms");
    // 10 ms later the widener's bass filter has forgotten the difference too.
    EXPECT(max_difference(slow.left, fast.left, at(0.51f)) == 0.0, "and fully up at 500 ms");

    const Setup long_attack = [](Thesis& d) {
      d.set_param(p::kResonance, 5.0f);
      d.set_param(p::kAttack, 2.0f);
    };
    Stereo longer = play(long_attack, kAllOff, 440.0f, 1.2f);
    Stereo fast_again = play(broad, kAllOff, 440.0f, 1.2f);
    EXPECT_NEAR(level_ratio(longer.left, fast_again.left, 1.0f), 0.5, 0.01, "Attack 2 s: half up after 1 s");
    EXPECT(level_ratio(fast.left, fast.left, 0.02f) == 1.0 && rms(fast.left, at(0.012f), at(0.05f)) > 0.01,
           "Attack 10 ms is up within 12 ms");

    // Release 2 s (the default), let go at 1 s.
    Stereo hold = play(broad, kAllOff, 440.0f, 4.0f);
    plain(device);
    device.set_param(p::kResonance, 5.0f);
    device.note_on(1, 440.0f, 1.0f);
    Stereo before = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo let_go = concat(before, render(device, 3.0f, kRate));
    EXPECT_NEAR(level_ratio(let_go.left, hold.left, 1.5f), 0.75, 0.01, "Release 2 s: three quarters left at 0.5 s");
    EXPECT_NEAR(level_ratio(let_go.left, hold.left, 2.0f), 0.5, 0.01, "half left at 1 s");
    EXPECT_NEAR(level_ratio(let_go.left, hold.left, 2.9f), 0.05, 0.01, "a twentieth left at 1.9 s");
    EXPECT(peak(let_go.left, at(3.2f)) == 0.0, "and exact silence after 2 s");
    EXPECT(peak(let_go.left, at(2.95f), at(2.99f)) > 0.0, "but not before");

    plain(device);
    device.set_param(p::kResonance, 5.0f);
    device.set_param(p::kRelease, 0.1f);
    device.note_on(1, 440.0f, 1.0f);
    Stereo start = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo quick = concat(start, render(device, 0.5f, kRate));
    EXPECT_NEAR(level_ratio(quick.left, hold.left, 1.05f), 0.5, 0.02, "Release 0.1 s: half left after 50 ms");
    EXPECT(peak(quick.left, at(1.2f)) == 0.0, "and gone after 100 ms");
  }

  // Breathe swells each partial between 0.3 and 1, once per 1 / Rate, each
  // with its own phase.
  {
    const Setup fixed = [](Thesis& d) { d.set_param(p::kResonance, 5.0f); };
    auto breathe_at = [](float rate) {
      return [rate](Thesis& d) {
        d.set_param(p::kResonance, 5.0f);
        d.set_param(p::kMode, 1.0f);
        d.set_param(p::kBreatheRate, rate);
      };
    };
    // The swell of partial `index` over time, in 10 ms steps from 50 ms.
    auto swell = [&](float rate, int index, float seconds) {
      const std::vector<float> still = partial_alone(fixed, index, 440.0f, seconds);
      const std::vector<float> moving = partial_alone(breathe_at(rate), index, 440.0f, seconds);
      std::vector<double> curve;
      for (float t = 0.05f; t < seconds - 0.01f; t += 0.01f) curve.push_back(level_ratio(moving, still, t));
      return curve;
    };
    auto extremes = [](const std::vector<double>& curve, double* lo, double* hi) {
      *lo = 1.0e9;
      *hi = 0.0;
      for (double v : curve) {
        *lo = std::min(*lo, v);
        *hi = std::max(*hi, v);
      }
    };
    // Times (s) at which the curve tops out: the centres of its runs above 0.98.
    auto crests = [](const std::vector<double>& curve) {
      std::vector<double> times;
      size_t i = 0;
      while (i < curve.size()) {
        if (curve[i] > 0.98) {
          size_t j = i;
          while (j < curve.size() && curve[j] > 0.98) ++j;
          times.push_back(0.05 + 0.01 * 0.5 * static_cast<double>(i + j - 1));
          i = j;
        } else {
          ++i;
        }
      }
      return times;
    };

    const std::vector<double> one_hz = swell(1.0f, 0, 3.6f);
    double lo, hi;
    extremes(one_hz, &lo, &hi);
    char label[200];
    std::snprintf(label, sizeof label, "Breathe moves the level between 0.3 and 1 (measured %.3f to %.3f)", lo, hi);
    EXPECT(std::fabs(lo - 0.3) < 0.01 && std::fabs(hi - 1.0) < 0.01, label);
    const std::vector<double> tops = crests(one_hz);
    EXPECT(tops.size() >= 3, "Rate 1 Hz: three crests in 3.6 s");
    if (tops.size() >= 3) {
      EXPECT_NEAR(tops[1] - tops[0], 1.0, 0.03, "one second apart");
      EXPECT_NEAR(tops[2] - tops[1], 1.0, 0.03, "and again");
      // The swell is a squared sine, so it spends more time low than high:
      // its mean over a cycle is 0.3 + 0.7 x 3/8.
      double sum = 0.0;
      const size_t first = static_cast<size_t>((tops[0] - 0.05) / 0.01 + 0.5);
      for (size_t i = first; i < first + 200; ++i) sum += one_hz[i];
      EXPECT_NEAR(sum / 200.0, 0.5625, 0.01, "the swell is a squared sine (mean over two cycles)");
    }

    const std::vector<double> two_hz = crests(swell(2.0f, 0, 2.0f));
    EXPECT(two_hz.size() >= 3 && std::fabs(two_hz[1] - two_hz[0] - 0.5) < 0.02 &&
               std::fabs(two_hz[2] - two_hz[1] - 0.5) < 0.02,
           "Rate 2 Hz: crests half a second apart");

    // The mirror leads the original by 0.17 of a cycle, the octaflip by 0.33.
    const std::vector<double> mirror = crests(swell(1.0f, 1, 3.6f));
    const std::vector<double> octaflip = crests(swell(1.0f, 2, 3.6f));
    if (!tops.empty() && !mirror.empty() && !octaflip.empty()) {
      const double lead_mirror = std::fmod(tops[0] - mirror[0] + 2.0, 1.0);
      const double lead_octaflip = std::fmod(tops[0] - octaflip[0] + 2.0, 1.0);
      std::snprintf(label, sizeof label, "the partials breathe out of step (leads %.3f and %.3f of a cycle)",
                    lead_mirror, lead_octaflip);
      EXPECT(std::fabs(lead_mirror - 0.17) < 0.02 && std::fabs(lead_octaflip - 0.33) < 0.02, label);
    } else {
      EXPECT(false, "the partials breathe out of step");
    }

    // Fixed does not move at all.
    Stereo a = play(fixed, kAllOff, 440.0f, 1.0f);
    const Setup other_rate = [](Thesis& d) {
      d.set_param(p::kResonance, 5.0f);
      d.set_param(p::kBreatheRate, 2.0f);
    };
    Stereo b = play(other_rate, kAllOff, 440.0f, 1.0f);
    EXPECT(a.left == b.left, "Fixed ignores Rate");
  }

  // Drift wobbles the pitch by 2 % either way; Gravity lands a fifth up.
  {
    // The band's centre over time, in 1.4 s windows a third of a second apart.
    auto wander = [&](float mode, float rate, double* lo, double* hi) {
      const Setup setup = [mode, rate](Thesis& d) {
        d.set_param(p::kResonance, 50.0f);
        d.set_param(p::kMode, mode);
        d.set_param(p::kBreatheRate, rate);
      };
      Stereo out = play(setup, kAllOff, 880.0f, 14.0f);
      *lo = 1.0e9;
      *hi = 0.0;
      for (size_t from = at(0.5f); from + 65536 <= out.left.size(); from += 16384) {
        const double hz = spectrum(out.left, kRate, from, from + 65536, 65536).centroid(820.0, 940.0);
        *lo = std::min(*lo, hz);
        *hi = std::max(*hi, hz);
      }
    };
    double fixed_lo, fixed_hi, drift_lo, drift_hi;
    wander(0.0f, 0.1f, &fixed_lo, &fixed_hi);
    wander(2.0f, 0.1f, &drift_lo, &drift_hi);
    char label[200];
    std::snprintf(label, sizeof label, "Fixed holds the pitch (%.1f to %.1f Hz)", fixed_lo, fixed_hi);
    EXPECT(fixed_hi - fixed_lo < 0.012 * 880.0 && fixed_lo > 872.0 && fixed_hi < 888.0, label);
    std::snprintf(label, sizeof label, "Drift swings it about 2 %% either way (%.1f to %.1f Hz)", drift_lo, drift_hi);
    EXPECT(drift_hi - drift_lo > 0.028 * 880.0 && drift_hi - drift_lo < 0.042 * 880.0 &&
               drift_lo > 880.0 * 0.978 && drift_hi < 880.0 * 1.022,
           label);

    // Rate sets how fast: at 2 Hz a 1.4 s window averages the swing away.
    double fast_lo, fast_hi;
    wander(2.0f, 2.0f, &fast_lo, &fast_hi);
    std::snprintf(label, sizeof label, "Drift at 2 Hz averages out over 1.4 s (%.1f to %.1f Hz)", fast_lo, fast_hi);
    EXPECT(fast_hi - fast_lo < 0.5 * (drift_hi - drift_lo), label);

    const Setup gravity = [](Thesis& d) {
      d.set_param(p::kResonance, 50.0f);
      d.set_param(p::kMode, 3.0f);
    };
    const int chord[6] = {69, 55, 57, 65, 59, 62};
    expect_chord("Gravity (a fifth above)", gravity, 69, chord, 1.5);
  }

  // Width: mono up to 75, level trim on the way, stereo above.
  {
    auto at_width = [](float width) {
      return [width](Thesis& d) { d.set_param(p::kWidth, width); };
    };
    // A6: the widener leaves what is below 200 Hz alone, so measure above it.
    Stereo mono = play(at_width(0.0f), kAllOff, 1760.0f, 3.0f);
    Stereo normal = play(at_width(50.0f), kAllOff, 1760.0f, 3.0f);
    Stereo three_quarters = play(at_width(75.0f), kAllOff, 1760.0f, 3.0f);
    Stereo full = play(at_width(100.0f), kAllOff, 1760.0f, 3.0f);
    EXPECT(mono.left == mono.right && normal.left == normal.right && three_quarters.left == three_quarters.right,
           "Width 0 to 75 is mono");
    const double base = rms(normal.left, at(0.2f));
    EXPECT_NEAR(rms(mono.left, at(0.2f)) / base, 1.409, 0.02, "Width 0 is 3 dB up on Width 50");
    EXPECT_NEAR(rms(three_quarters.left, at(0.2f)) / base, 0.706, 0.02, "Width 75 is 3 dB down");
    const double spread = correlation(full.left, full.right, at(0.2f));
    char label[160];
    std::snprintf(label, sizeof label, "Width 100 is stereo (correlation %.2f)", spread);
    EXPECT(spread < 0.6, label);
    EXPECT(full.left != full.right, "left and right differ");
  }

  // Notes: gain, chords, voices.
  {
    Stereo loud = play(nullptr, 3, 440.0f, 1.0f);
    plain(device);
    switches(device, 3);
    device.note_on(1, 440.0f, 0.5f);
    Stereo soft = render(device, 1.0f, kRate);
    double worst = 0.0;
    for (size_t i = 0; i < loud.left.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(loud.left[i]) - 2.0 * soft.left[i]));
    }
    EXPECT(worst < 1.0e-6 && rms(soft.left) > 1.0e-3, "note gain scales the note linearly");

    // Two notes are the sum of each alone: every band hears the same noise.
    Stereo first = play(nullptr, 3, 220.0f, 1.0f);
    Stereo second = play(nullptr, 3, 587.33f, 1.0f);
    plain(device);
    switches(device, 3);
    device.note_on(1, 220.0f, 1.0f);
    device.note_on(2, 587.33f, 1.0f);
    Stereo both = render(device, 1.0f, kRate);
    worst = 0.0;
    for (size_t i = 0; i < both.left.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(both.left[i]) - first.left[i] - second.left[i]));
    }
    EXPECT(worst < 2.0e-6, "a chord is the sum of its notes");

    // Releasing one note leaves the other untouched.
    plain(device);
    switches(device, 3);
    device.set_param(p::kRelease, 0.1f);
    device.note_on(1, 220.0f, 1.0f);
    device.note_on(2, 587.33f, 1.0f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(max_difference(rest.left, std::vector<float>(second.left.begin() + at(0.5f), second.left.end()),
                          at(0.15f)) < 2.0e-6,
           "note_off releases only its note");

    // Eight voices. Eight notes together are the sum of the eight alone; a
    // ninth takes the oldest voice and the other eight carry on, so two
    // seconds later the result is the last eight notes. (Quiet notes: the
    // sums have to stay under the output clipper's knee.)
    const float pitches[9] = {130.81f, 146.83f, 164.81f, 196.0f, 220.0f, 261.63f, 293.66f, 329.63f, 392.0f};
    auto chord_of = [&](int from, int to) {
      plain(device);
      switches(device, 3);
      for (int n = from; n < to; ++n) device.note_on(n, pitches[n], 0.25f);
      return render(device, 3.0f, kRate).left;
    };
    std::vector<float> first_eight(at(3.0f), 0.0f), last_eight(at(3.0f), 0.0f);
    for (int n = 0; n < 9; ++n) {
      const std::vector<float> solo = chord_of(n, n + 1);
      for (size_t i = 0; i < solo.size(); ++i) {
        if (n < 8) first_eight[i] += solo[i];
        if (n > 0) last_eight[i] += solo[i];
      }
    }
    const std::vector<float> eight = chord_of(0, 8);
    char label[160];
    const double all_eight = max_difference(eight, first_eight, at(2.0f));
    std::snprintf(label, sizeof label, "eight notes sound together (difference from their sum %.2g)", all_eight);
    EXPECT(all_eight < 1.0e-5 && rms(eight, at(2.0f)) > 3.0e-3 && peak(eight) < 0.5, label);

    const std::vector<float> nine = chord_of(0, 9);
    const double stolen = max_difference(nine, last_eight, at(2.0f));
    std::snprintf(label, sizeof label, "a ninth note takes the oldest of the eight voices (difference %.2g)", stolen);
    EXPECT(stolen < 1.0e-5 && max_difference(nine, first_eight, at(2.0f)) > 3.0e-3, label);

    // A key struck again: the old voice releases, the new one attacks.
    plain(device);
    device.set_param(p::kRelease, 0.1f);
    device.note_on(1, 440.0f, 1.0f);
    render(device, 0.5f, kRate);
    device.note_on(1, 440.0f, 1.0f);
    Stereo again = render(device, 1.5f, kRate);
    Stereo single = play(nullptr, kAllOff, 440.0f, 2.0f);
    EXPECT(rms(again.left, at(0.02f), at(0.08f)) > 1.2 * rms(single.left, at(0.52f), at(0.58f)),
           "a restruck key overlaps its old voice while that releases");
    // The new voice's filter started later; a second on its ringing has gone.
    EXPECT(max_difference(again.left, std::vector<float>(single.left.begin() + at(0.5f), single.left.end()),
                          at(1.0f)) < 2.0e-6,
           "and ends as one voice, not two");
  }

  // Levels at the default patch.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo one = render(device, 8.0f, kRate);
    const double one_db = db(peak(one.left));
    char label[160];
    std::snprintf(label, sizeof label, "one note at gain 0.7 peaks between -24 and -10 dBFS (%.1f)", one_db);
    EXPECT(one_db > -24.0 && one_db < -10.0, label);

    device.init(kRate);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 3) / 12.0f), 0.7f);
    Stereo eight = render(device, 8.0f, kRate);
    std::snprintf(label, sizeof label, "eight held notes stay under the clip knee (peak %.3f)", peak(eight.left));
    EXPECT(peak(eight.left) < 0.5 && peak(eight.right) < 0.5, label);
  }

  // The factory presets: each sounds, on both channels, within bounds.
  {
    struct Preset {
      const char* name;
      float values[p::kNumParams];
    };
    const Preset presets[] = {
        {"Thesis Default", {62, 40, 50, 0.5f, 2, 1, 0.3f, 0, 1, 1, 0, 0, 0, 0, 0}},
        {"Glass Choir", {64, 80, 80, 1.5f, 4, 1, 0.15f, 0, 1, 1, 0, 0, 0, 0, 0}},
        {"Drifting Minor", {60, 55, 60, 0.8f, 3, 2, 0.25f, 10, 1, 1, 0, 0, 0, 1, 9}},
        {"Gravity Well", {58, 30, 100, 0.3f, 5, 3, 0.4f, 40, 1, 1, 1, 0, 0, 0, 0}},
        {"Strummed Lydian", {62, 45, 60, 0.05f, 1.2f, 0, 0.3f, 80, 1, 1, 1, 0, 0, 6, 0}},
        {"Fixed Full Stack", {62, 60, 70, 0.4f, 2.5f, 0, 0.3f, 20, 1, 1, 1, 1, 1, 0, 0}},
        {"Pentatonic Breath", {62, 50, 50, 0.2f, 1.5f, 1, 0.6f, 0, 1, 1, 0, 0, 0, 9, 0}},
        {"Dark Phrygian", {50, 25, 30, 1.0f, 6, 2, 0.12f, 0, 1, 1, 0, 1, 0, 5, 4}},
        {"Sparse Mirror", {62, 70, 40, 0.4f, 2.5f, 1, 0.2f, 0, 1, 0, 0, 0, 0, 0, 0}},
    };
    for (const Preset& preset : presets) {
      device.init(kRate);
      bool in_range = true;
      for (int id = 0; id < p::kNumParams; ++id) {
        in_range = in_range && preset.values[id] >= p::kParamMin[id] && preset.values[id] <= p::kParamMax[id];
        device.set_param(id, preset.values[id]);
      }
      device.note_on(1, 196.0f, 0.8f);
      device.note_on(2, 261.63f, 0.8f);
      device.note_on(3, 329.63f, 0.8f);
      Stereo out = render(device, 4.0f, kRate);
      char label[160];
      std::snprintf(label, sizeof label, "preset %s: in range, sounding and clear of the knee (peak %.3f)",
                    preset.name, std::max(peak(out.left), peak(out.right)));
      EXPECT(in_range && finite(out.left) && peak(out.left) > 0.01 && peak(out.right) > 0.01 &&
                 peak(out.left) < 0.5 && peak(out.right) < 0.5,
             label);
    }
  }

  // Moving a control while a chord sounds does not click.
  {
    // The largest sample-to-sample step in the 16 samples after `id` jumps
    // to `value`, over the largest in the 10 ms before; the worst of five
    // moments, since a jump that lands on a zero crossing hides.
    auto worst_jump = [](int id, float from, float value) {
      double worst = 0.0;
      for (int moment = 0; moment < 5; ++moment) {
        plain(device);
        device.set_param(id, from);
        device.note_on(1, 220.0f, 1.0f);
        device.note_on(2, 329.63f, 1.0f);
        Stereo before = render(device, 1.0f + 0.0137f * static_cast<float>(moment), kRate);
        device.set_param(id, value);
        Stereo after = render(device, 0.1f, kRate);
        const double natural = max_step(before.left, before.left.size() - 480);
        std::vector<float> joined(before.left.end() - 1, before.left.end());
        joined.insert(joined.end(), after.left.begin(), after.left.begin() + 16);
        worst = std::max(worst, max_step(joined) / natural);
      }
      return worst;
    };
    char label[160];
    const double resonance_jump = worst_jump(p::kResonance, 40.0f, 10.0f);
    std::snprintf(label, sizeof label, "Resonance 40 to 10 while held: no click (step %.2f x the signal's own)",
                  resonance_jump);
    EXPECT(resonance_jump < 2.0, label);
    const double width_jump = worst_jump(p::kWidth, 0.0f, 75.0f);
    std::snprintf(label, sizeof label, "Width 0 to 75 while held: no click (step %.2f x the signal's own)",
                  width_jump);
    EXPECT(width_jump < 2.0, label);

    // And the move is heard: a wider band is louder.
    device.init(kRate);
    device.set_param(p::kMode, 0.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo narrow = render(device, 3.0f, kRate);
    device.set_param(p::kResonance, 10.0f);
    Stereo wide = render(device, 3.0f, kRate);
    EXPECT(rms(wide.left, at(0.5f)) > 1.5 * rms(narrow.left, at(1.0f)), "Resonance acts on a held note");

    // Attack and Release act on notes that are already sounding.
    plain(device);
    device.set_param(p::kRelease, 5.0f);
    device.note_on(1, 440.0f, 1.0f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    render(device, 0.5f, kRate);
    device.set_param(p::kRelease, 0.1f);
    Stereo cut = render(device, 0.5f, kRate);
    EXPECT(peak(cut.left, 0, at(0.05f)) > 0.0 && peak(cut.left, at(0.3f)) == 0.0,
           "shortening Release ends a tail that is already running");
  }

  // The output does not depend on the block size.
  {
    const Setup busy = [](Thesis& d) {
      d.set_param(p::kMode, 2.0f);
      d.set_param(p::kStrum, 30.0f);
      d.set_param(p::kWidth, 100.0f);
    };
    Stereo host = play(busy, kAllOn, 330.0f, 1.0f, kRate, 128);
    Stereo odd = play(busy, kAllOn, 330.0f, 1.0f, kRate, 37);
    Stereo single = play(busy, kAllOn, 330.0f, 1.0f, kRate, 1);
    EXPECT(host.left == odd.left && host.right == odd.right && host.left == single.left &&
               host.right == single.right,
           "blocks of 128, 37 and 1 give the same samples");

    // Also across a sleep, with a control moved while nothing sounds: the
    // second note is the same whatever the block size was.
    auto second_note = [](int block) {
      device.init(kRate);
      device.set_param(p::kRelease, 0.5f);
      device.note_on(1, 330.0f, 1.0f);
      render(device, 0.5f, kRate, block);
      device.note_off(1);
      render(device, 1.5f, kRate, block);
      device.set_param(p::kWidth, 100.0f);
      device.set_param(p::kResonance, 15.0f);
      device.note_on(2, 247.0f, 1.0f);
      return render(device, 0.5f, kRate, block);
    };
    Stereo second_host = second_note(128);
    Stereo second_odd = second_note(37);
    EXPECT(second_host.left == second_odd.left && second_host.right == second_odd.right &&
               rms(second_host.left) > 1.0e-3,
           "a note after a sleep does not depend on the block size either");

    // And a control moved during the sleep is simply there for the next
    // note: the same samples as if it had been set from the start.
    device.init(kRate);
    device.set_param(p::kRelease, 0.5f);
    device.set_param(p::kWidth, 100.0f);
    device.note_on(1, 330.0f, 1.0f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    render(device, 1.5f, kRate);
    device.set_param(p::kResonance, 15.0f);
    device.note_on(2, 247.0f, 1.0f);
    Stereo from_start = render(device, 0.5f, kRate);
    EXPECT(from_start.left == second_host.left && from_start.right == second_host.right,
           "a control moved while asleep does not glide in on the next note");
  }

  // 96 kHz is the same instrument.
  {
    Stereo low = play(sharp, kAllOff, 440.0f, 8.0f, 48000.0f);
    Stereo high = play(sharp, kAllOff, 440.0f, 8.0f, 96000.0f);
    const double hz = spectrum(high.left, 96000.0, at(0.5f, 96000.0f), high.left.size(), 65536).peak_hz();
    EXPECT_NEAR(hz, 440.0, 4.4, "the same pitch at 96 kHz");
    const double change = db(rms(high.left, at(0.5f, 96000.0f)) / rms(low.left, at(0.5f)));
    char label[160];
    std::snprintf(label, sizeof label, "the same level at 96 kHz (%.2f dB)", change);
    EXPECT(std::fabs(change) < 1.0, label);

    const Setup strummed = [](Thesis& d) { d.set_param(p::kStrum, 100.0f); };
    Stereo bare = play(strummed, kAllOff, 440.0f, 0.5f, 96000.0f);
    Stereo late = play(strummed, 2, 440.0f, 0.5f, 96000.0f);
    EXPECT(first_difference(late.left, bare.left) == 19200, "the same strum time at 96 kHz");

    const Setup broad = [](Thesis& d) { d.set_param(p::kResonance, 5.0f); };
    const Setup slow = [](Thesis& d) {
      d.set_param(p::kResonance, 5.0f);
      d.set_param(p::kAttack, 0.5f);
    };
    Stereo quick_96 = play(broad, kAllOff, 440.0f, 0.6f, 96000.0f);
    Stereo slow_96 = play(slow, kAllOff, 440.0f, 0.6f, 96000.0f);
    EXPECT_NEAR(level_ratio(slow_96.left, quick_96.left, 0.25f, 96000.0f), 0.5, 0.01,
                "the same attack time at 96 kHz");

    const Setup gravity = [](Thesis& d) {
      d.set_param(p::kResonance, 50.0f);
      d.set_param(p::kMode, 3.0f);
    };
    Stereo pulled = play(gravity, kAllOff, 440.0f, 6.0f, 96000.0f);
    const double fifth = spectrum(pulled.left, 96000.0, at(0.5f, 96000.0f), pulled.left.size(), 65536).peak_hz();
    EXPECT_NEAR(fifth, 660.0, 6.6, "Gravity lands on the same fifth at 96 kHz");
  }

  // Sleeps after the release, wakes for the next note.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    render(device, 2.5f, kRate);
    Stereo asleep = render(device, 1.0f, kRate);
    EXPECT(peak(asleep.left) == 0.0 && peak(asleep.right) == 0.0, "exact silence once the note has gone");
    device.note_on(2, 220.0f, 0.7f);
    Stereo awake = render(device, 1.0f, kRate);
    EXPECT(rms(awake.left) > 1.0e-3, "the next note wakes it");
  }

  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 3) / 12.0f), 0.7f);
  report_cost("thesis (8 notes)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  device.init(kRate);
  device.set_param(p::kMode, 2.0f);
  for (int k = 0; k < 5; ++k) device.set_param(p::kMirrorEnabled + k, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 3) / 12.0f), 0.7f);
  report_cost("thesis (8 notes, all six partials, Drift)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("thesis");
}
