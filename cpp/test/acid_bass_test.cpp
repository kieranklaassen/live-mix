// Native harness for Acid Bass (cpp/devices/acid-bass). The conformance pass
// covers silence before and after notes, a pile of keys, parameter abuse and
// other sample rates; the rest measures what makes it this instrument and not
// the ladder bass beside it: one oscillator through a three-pole filter whose
// resonance keeps the bass, separate loudness and filter envelopes, accents
// that add up, and keys that slide when they overlap: a tied key is heard
// (the loudness comes back) but strikes neither the filter nor an accent.
//
// Nobody has listened to this instrument: every claim below is a number.

#include "../devices/acid-bass/acid_bass.h"

#include <algorithm>
#include <cctype>
#include <cstdlib>
#include <cstring>
#include <functional>
#include <string>

#include "support/test_kit.h"

using namespace testkit;
using livemix::AcidBass;
namespace p = livemix::acid_bass;

static AcidBass device;
static AcidBass other;

static const float kRate = 48000.0f;
static const double kC0 = 16.3516, kE0 = 20.6017, kA0 = 27.5, kA1 = 55.0, kC2 = 65.40639, kA2 = 110.0;
static const double kC3 = 130.8128, kA3 = 220.0, kC4 = 261.6256, kC5 = 523.2511, kC6 = 1046.502;

static char label[400];

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate + 0.5); }

// A steady, plain voice: a sawtooth held at full level with the filter as far
// open as Cutoff goes, no resonance, no envelope sweep, no accent, no drive.
// Each check changes only what it is about.
static void steady(AcidBass& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kWave, 0.0f);
  d.set_param(p::kCutoff, 5000.0f);
  d.set_param(p::kResonance, 0.0f);
  d.set_param(p::kEnvMod, 0.0f);
  d.set_param(p::kDecay, 0.3f);
  d.set_param(p::kAccent, 0.0f);
  d.set_param(p::kSlide, 0.1f);
  d.set_param(p::kSustain, 20.0f);  // hold
  d.set_param(p::kDrive, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

// The strongest frequency in [lo, hi] over [from, to). The same idea as
// dominant_frequency, but its first pass steps by half the window's
// resolution instead of 600 times, which is what a narrow band around a known
// pitch needs and many times cheaper on a long window.
static double peak_frequency(const std::vector<float>& x, double rate, double lo, double hi, size_t from,
                             size_t to) {
  to = std::min(to, x.size());
  double span = 0.5 * rate / static_cast<double>(to - from);
  double best_hz = lo, best = -1.0;
  for (double hz = lo; hz <= hi; hz += span) {
    const double level = tone_level(x, hz, rate, from, to);
    if (level > best) {
      best = level;
      best_hz = hz;
    }
  }
  for (int pass = 0; pass < 4; ++pass) {
    const double centre = best_hz;
    for (int i = -5; i <= 5; ++i) {
      const double hz = centre + span * i / 5.0;
      const double level = tone_level(x, hz, rate, from, to);
      if (level > best) {
        best = level;
        best_hz = hz;
      }
    }
    span /= 5.0;
  }
  return best_hz;
}

// Hann-weighted mean: the DC a window that is not a whole number of cycles
// would otherwise invent.
static double dc_offset(const std::vector<float>& x, size_t from, size_t to) {
  double sum = 0.0, weights = 0.0;
  const size_t n = to - from;
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    sum += w * x[from + i];
    weights += w;
  }
  return sum / weights;
}

// Amplitude-weighted mean frequency of the harmonics of `f0` up to 12 kHz: a
// brightness in hertz.
static double centroid(const std::vector<float>& x, double f0, size_t from, size_t to) {
  double weighted = 0.0, total = 0.0;
  for (int n = 1; n * f0 < 12000.0; ++n) {
    const double level = tone_level(x, n * f0, kRate, from, to);
    weighted += n * f0 * level;
    total += level;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// What the filter does to harmonic `n` of a sawtooth on `f0`, in dB: its
// level against the fundamental's, times n (a sawtooth's harmonics fall as
// 1/n), so 0 dB is "as the oscillator made it".
static double filter_gain_db(const std::vector<float>& x, double f0, int n, size_t from, size_t to = SIZE_MAX) {
  return db(tone_level(x, n * f0, kRate, from, to) * n / tone_level(x, f0, kRate, from, to));
}

// The harmonic of a sawtooth on `f0` the filter lifts most, in hertz: where
// the resonant peak stands.
static double peak_harmonic(const std::vector<float>& x, double f0, size_t from, size_t to, double hi = 4000.0) {
  double best = -1.0, best_hz = 0.0;
  for (int n = 2; n * f0 < hi; ++n) {
    const double lifted = tone_level(x, n * f0, kRate, from, to) * n;
    if (lifted > best) {
      best = lifted;
      best_hz = n * f0;
    }
  }
  return best_hz;
}

// The loudest component of `x` that is not a harmonic of `f0`, against the
// fundamental: what folded back from above half the sample rate, or anything
// else that does not belong. A 32768-point Hann spectrum from `from`; a bin
// counts as stray when it is more than 24 bins (35 Hz at 48 kHz) from every
// harmonic, where the skirt of even a harmonic 20 dB over the fundamental is
// 70 dB under it. `hz` is told where the stray component was found.
static double stray_level(const std::vector<float>& x, double f0, double rate, size_t from, double* hz = nullptr) {
  static livemix::kit::Fft<32768> fft;
  static bool ready = false;
  if (!ready) {
    fft.init();
    ready = true;
  }
  const int n = 32768;
  static std::vector<float> re(n), im(n);
  for (int i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * i / n);
    re[i] = from + i < x.size() ? static_cast<float>(w * x[from + i]) : 0.0f;
    im[i] = 0.0f;
  }
  fft.forward(re.data(), im.data());
  const double bin = rate / n;
  double worst = 0.0, fundamental = 0.0;
  for (int i = 8; i < n / 2; ++i) {
    const double f = i * bin;
    if (f > 20000.0) break;
    const double magnitude = std::sqrt(static_cast<double>(re[i]) * re[i] + static_cast<double>(im[i]) * im[i]);
    const double k = std::round(f / f0);
    if (k == 1.0 && std::fabs(f - f0) < 2.0 * bin) fundamental = std::max(fundamental, magnitude);
    if (k < 1.0 || std::fabs(f - k * f0) > 24.0 * bin) {
      if (magnitude > worst) {
        worst = magnitude;
        if (hz) *hz = f;
      }
    }
  }
  return fundamental > 0.0 ? worst / fundamental : 1.0;
}

// The harmonics of `f0` from the third up to 4 kHz, as one level against the
// fundamental: how much buzz there is above a note.
static double upper_harmonics_db(const std::vector<float>& x, double f0, size_t from) {
  double sum = 0.0;
  for (int n = 3; n * f0 < 4000.0; ++n) {
    const double level = tone_level(x, n * f0, kRate, from);
    sum += level * level;
  }
  return db(std::sqrt(sum) / tone_level(x, f0, kRate, from));
}

// Largest difference between two renders, sample for sample.
static double difference(const Stereo& a, const Stereo& b, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// How sudden an event is (docs/solutions/best-practices/
// click-checks-need-an-event-free-reference.md): the same passage is rendered
// with and without the event, and the difference between the two renders is
// followed for 20 ms. It starts where it first passes a hundredth of the
// largest value it reaches (what happens before the decimators comes out
// half a millisecond late), and the largest difference in the 8 samples from
// there is held against the largest of all. A fade or a smoothed change has
// gone a small part of the way by then; a jump is all there at once, even
// one the decimators have rounded. The event is tried at eight moments a
// little apart so a jump cannot hide in a zero crossing; the worst is
// returned.
static double suddenness(const std::function<void(AcidBass&)>& setup, const std::function<void(AcidBass&)>& event,
                         float lead = 0.25f) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const float before = lead + 0.0013f * static_cast<float>(trial);
    setup(device);
    render(device, before, kRate);
    event(device);
    Stereo with = render(device, 0.02f, kRate);
    setup(other);
    render(other, before, kRate);
    Stereo without = render(other, 0.02f, kRate);
    std::vector<double> change(with.size());
    double whole = 0.0;
    for (size_t i = 0; i < with.size(); ++i) {
      change[i] = std::fabs(static_cast<double>(with.left[i]) - without.left[i]);
      whole = std::max(whole, change[i]);
    }
    if (whole <= 0.0) continue;
    size_t onset = 0;
    while (change[onset] < 0.01 * whole) ++onset;
    double early = 0.0;
    for (size_t i = onset; i < onset + 8 && i < change.size(); ++i) early = std::max(early, change[i]);
    worst = std::max(worst, early / whole);
  }
  return worst;
}

// --- the presets of device.json, as the ten values each one loads ------------------------

struct Preset {
  const char* name;
  float values[p::kNumParams];
};

static const Preset kPresets[] = {
    {"Acid line", {0.0f, 280.0f, 0.7f, 0.55f, 0.35f, 0.6f, 0.12f, 3.0f, 0.134f, -9.0f}},
    {"Hollow square line", {1.0f, 700.0f, 0.3f, 0.35f, 0.7f, 0.5f, 0.1f, 5.0f, 0.078f, -6.0f}},
    {"Rubber slides", {0.0f, 160.0f, 0.78f, 0.42f, 0.45f, 0.5f, 0.5f, 5.0f, 0.106f, -10.0f}},
    {"Resonant scream", {0.0f, 600.0f, 0.95f, 0.75f, 0.5f, 1.0f, 0.08f, 3.0f, 0.553f, -7.0f}},
    {"Soft dark line", {0.0f, 110.0f, 0.15f, 0.2f, 0.8f, 0.25f, 0.15f, 4.0f, 0.0f, -7.0f}},
    {"Slow closing tone", {0.0f, 80.0f, 0.45f, 0.7f, 10.0f, 0.3f, 0.3f, 20.0f, 0.051f, -9.0f}},
    {"Short pluck", {0.0f, 220.0f, 0.5f, 0.7f, 0.12f, 0.6f, 0.05f, 0.8f, 0.368f, -5.0f}},
    {"Held sub tone", {1.0f, 90.0f, 0.25f, 0.08f, 2.0f, 0.2f, 0.2f, 20.0f, 0.0f, -6.5f}},
    {"Dub weight", {1.0f, 75.0f, 0.55f, 0.25f, 0.2f, 0.4f, 0.18f, 2.0f, 0.293f, -6.0f}},
    {"Driven growl", {0.0f, 120.0f, 0.55f, 0.4f, 0.9f, 0.6f, 0.1f, 4.0f, 0.684f, -6.0f}},
    {"Wet squelch", {0.0f, 150.0f, 0.88f, 0.85f, 0.2f, 0.9f, 0.07f, 2.0f, 0.051f, -10.0f}},
    {"Long glide drone", {0.0f, 400.0f, 0.5f, 0.05f, 4.0f, 0.2f, 1.0f, 20.0f, 0.106f, -9.0f}},
    {"Deep slow sweep", {1.0f, 50.0f, 0.6f, 0.6f, 6.0f, 0.3f, 0.4f, 15.0f, 0.025f, -7.0f}},
    {"Bright open saw", {0.0f, 2200.0f, 0.2f, 0.3f, 0.6f, 0.5f, 0.06f, 4.0f, 0.163f, -8.0f}},
    {"Muted thump", {0.0f, 65.0f, 0.1f, 0.6f, 0.08f, 0.5f, 0.03f, 1.0f, 0.0f, -4.5f}},
    {"Quiet pulse", {1.0f, 220.0f, 0.3f, 0.15f, 0.3f, 0.15f, 0.12f, 1.2f, 0.0f, -3.5f}},
};
static const int kNumPresets = static_cast<int>(sizeof kPresets / sizeof kPresets[0]);
static const char* const kParamKeys[p::kNumParams] = {"wave",   "cutoff", "resonance", "envMod", "decay",
                                                      "accent", "slide",  "sustain",   "drive",  "volume"};

static void load(AcidBass& d, const Preset& preset, float rate = kRate) {
  d.init(rate);
  for (int id = 0; id < p::kNumParams; ++id) d.set_param(id, preset.values[id]);
}

// --- pitch --------------------------------------------------------------------------------

// Within 3 cents of the key from E0 to C6, at every sample rate, with the
// settings that could pull it: wide open, dark, and with resonance, the
// square, the envelope sweep and Drive all at once.
static void test_pitch() {
  struct Setting {
    const char* name;
    float wave, cutoff, resonance, env_mod, drive;
  };
  const Setting settings[] = {
      {"plain", 0.0f, 5000.0f, 0.0f, 0.0f, 0.0f},
      {"dark", 0.0f, 60.0f, 0.3f, 0.0f, 0.0f},
      {"everything", 1.0f, 400.0f, 1.0f, 1.0f, 1.0f},
  };
  double worst = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (const Setting& setting : settings) {
      for (double hz : {kE0, kA0, kA1, kA2, kA3, kC6}) {
        if (rate != kRate && (hz == kE0 || hz == kA2)) continue;
        steady(device, rate);
        device.set_param(p::kWave, setting.wave);
        device.set_param(p::kCutoff, setting.cutoff);
        device.set_param(p::kResonance, setting.resonance);
        device.set_param(p::kEnvMod, setting.env_mod);
        device.set_param(p::kDrive, setting.drive);
        device.note_on(1, static_cast<float>(hz), 0.8f);
        // Sixty cycles of the note (at most 2.5 s): the neighbouring harmonic
        // is sixty bins of the Hann window away and cannot lean on the peak.
        const double seconds = std::min(2.5, std::max(0.25, 60.0 / hz));
        Stereo out = render(device, static_cast<float>(0.5 + seconds), rate);
        const double found = peak_frequency(out.left, rate, hz * 0.985, hz * 1.015, at(0.5, rate), out.size());
        const double off = cents(found, hz);
        worst = std::max(worst, std::fabs(off));
        std::snprintf(label, sizeof label, "%.2f Hz, %s, at %.0f Hz sample rate is %.2f cents off (3)", hz,
                      setting.name, rate, off);
        EXPECT(std::fabs(off) < 3.0, label);
      }
    }
  }
  std::printf("pitch: worst error %.3f cents over E0..C6, three settings, three sample rates\n", worst);

  // The same with the shared helper, at the defaults.
  for (double hz : {kA0, kA1, kA2, kA3}) {
    device.init(kRate);
    device.set_param(p::kSustain, 20.0f);
    device.note_on(1, static_cast<float>(hz), 0.7f);
    Stereo out = render(device, static_cast<float>(0.5 + 60.0 / hz), kRate);
    const double found = dominant_frequency(out.left, kRate, hz * 0.94, hz * 1.06, at(0.5));
    std::snprintf(label, sizeof label, "default patch on %.1f Hz: dominant_frequency is %.2f cents off (3)", hz,
                  cents(found, hz));
    EXPECT(std::fabs(cents(found, hz)) < 3.0, label);
  }
}

// --- the filter ---------------------------------------------------------------------------

// Three poles: with no resonance the harmonics one and two octaves above
// Cutoff are 18 and 36 dB down (a four-pole filter reads 24 and 48), and the
// slope further up is 18 dB an octave. Read off A0 with Cutoff on its 16th
// harmonic, against the 1/n law of the sawtooth.
static void test_filter_slope() {
  steady(device);
  device.set_param(p::kCutoff, 440.0f);
  device.note_on(1, static_cast<float>(kA0), 0.7f);
  Stereo out = render(device, 3.0f, kRate);
  const double one = -filter_gain_db(out.left, kA0, 32, at(1.0));
  const double two = -filter_gain_db(out.left, kA0, 64, at(1.0));
  const double three = -filter_gain_db(out.left, kA0, 128, at(1.0));
  std::printf("filter, resonance 0: %.1f dB down one octave above Cutoff, %.1f dB two, %.1f dB three\n", one, two,
              three);
  EXPECT_NEAR(one, 18.0, 3.0, "one octave above Cutoff the filter is 18 dB down");
  EXPECT_NEAR(two, 36.0, 3.0, "two octaves above Cutoff the filter is 36 dB down");
  EXPECT_NEAR(three - two, 18.0, 1.5, "and from there it falls 18 dB an octave: three poles, not four");
  EXPECT(-filter_gain_db(out.left, kA0, 4, at(1.0)) < 1.0, "two octaves under Cutoff nothing is taken");
}

// Resonance: a peak on Cutoff that grows by a stated amount, the fundamental
// kept, and a filter that at 1 rings long but does not sing by itself.
static void test_resonance() {
  // Level of the harmonic on Cutoff against Resonance 0, and where the peak stands.
  double at_cutoff[5];
  const float settings[5] = {0.0f, 0.25f, 0.5f, 0.75f, 1.0f};
  const double expected[5] = {0.0, 11.1, 16.8, 24.0, 37.8};
  for (int i = 0; i < 5; ++i) {
    steady(device);
    device.set_param(p::kCutoff, 440.0f);
    device.set_param(p::kResonance, settings[i]);
    device.note_on(1, static_cast<float>(kA0), 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    at_cutoff[i] = filter_gain_db(out.left, kA0, 16, at(1.0));
    if (i > 0) {
      const double where = peak_harmonic(out.left, kA0, at(1.0), out.size());
      std::snprintf(label, sizeof label,
                    "Resonance %.2f lifts the harmonic on Cutoff by %.1f dB (%.1f +- 2) and peaks at %.0f Hz (440)",
                    settings[i], at_cutoff[i] - at_cutoff[0], expected[i], where);
      EXPECT(std::fabs(at_cutoff[i] - at_cutoff[0] - expected[i]) < 2.0 && std::fabs(where - 440.0) < 28.0, label);
      EXPECT(peak(out.left) < 1.0 && finite(out.left), "and stays bounded");
    }
  }
  std::printf("resonance: the harmonic on Cutoff rises %.1f, %.1f, %.1f and %.1f dB at 0.25, 0.5, 0.75 and 1\n",
              at_cutoff[1] - at_cutoff[0], at_cutoff[2] - at_cutoff[0], at_cutoff[3] - at_cutoff[0],
              at_cutoff[4] - at_cutoff[0]);

  // The peak follows Cutoff.
  for (float cutoff : {110.0f, 1760.0f}) {
    steady(device);
    device.set_param(p::kCutoff, cutoff);
    device.set_param(p::kResonance, 0.8f);
    device.note_on(1, static_cast<float>(kA0), 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    const double where = peak_harmonic(out.left, kA0, at(1.0), out.size());
    std::snprintf(label, sizeof label, "Cutoff %.0f Hz, Resonance 0.8: the peak is at %.0f Hz", cutoff, where);
    EXPECT(std::fabs(where - cutoff) < 28.0, label);
  }

  // The bass stays: a 55 Hz fundamental under a 1 kHz filter.
  double fundamental[3];
  const float amounts[3] = {0.0f, 0.9f, 1.0f};
  for (int i = 0; i < 3; ++i) {
    steady(device);
    device.set_param(p::kCutoff, 1000.0f);
    device.set_param(p::kResonance, amounts[i]);
    device.note_on(1, static_cast<float>(kA1), 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    fundamental[i] = db(tone_level(out.left, kA1, kRate, at(1.0)));
  }
  std::printf("resonance: a 55 Hz fundamental loses %.1f dB at Resonance 0.9 and %.1f dB at 1\n",
              fundamental[0] - fundamental[1], fundamental[0] - fundamental[2]);
  std::snprintf(label, sizeof label, "Resonance 0.9 takes %.1f dB from a 55 Hz fundamental (under 6)",
                fundamental[0] - fundamental[1]);
  EXPECT(fundamental[0] - fundamental[1] < 6.0 && fundamental[0] - fundamental[1] > -1.0, label);
  EXPECT(fundamental[0] - fundamental[2] < 6.0, "and under 6 dB at Resonance 1");

  // At 1 the filter rings at Cutoff after each edge of a slow sawtooth and
  // the ring dies before the next one: just under oscillating by itself. A
  // sawtooth on C0 struck from rest has its edges half a period in and every
  // period after; the ring is read as the level around 1 kHz in 8 ms windows
  // 2 ms and 50 ms after an edge.
  steady(device);
  device.set_param(p::kCutoff, 1000.0f);
  device.set_param(p::kResonance, 1.0f);
  device.note_on(1, static_cast<float>(kC0), 0.7f);
  Stereo ring = render(device, 2.0f, kRate);
  double early = 0.0, late = 0.0;
  for (int cycle = 8; cycle < 24; ++cycle) {
    const double edge = (0.5 + cycle) / kC0;
    early += tone_level(ring.left, 1000.0, kRate, at(edge + 0.002), at(edge + 0.010));
    late += tone_level(ring.left, 1000.0, kRate, at(edge + 0.050), at(edge + 0.058));
  }
  std::printf("resonance 1: the ring at Cutoff is %.1f dB down 48 ms after the edge that started it\n",
              db(early / late));
  std::snprintf(label, sizeof label, "at Resonance 1 the ring falls %.1f dB in 48 ms (10 to 30: long, not for ever)",
                db(early / late));
  EXPECT(db(early / late) > 10.0 && db(early / late) < 30.0, label);
  EXPECT(peak(ring.left) < 1.0, "and the output stays bounded");
}


// --- the two envelopes --------------------------------------------------------------------

// Env Mod and Decay: a strike opens the filter above Cutoff and it comes back
// nine tenths of the way in the Decay time. Read as where the resonant peak
// stands on the harmonics of C0 (16 Hz apart) while a note is held.
static void test_filter_envelope() {
  const double base = 200.0;
  for (float decay : {2.0f, 6.0f}) {
    steady(device);
    device.set_param(p::kCutoff, static_cast<float>(base));
    device.set_param(p::kResonance, 0.8f);
    device.set_param(p::kEnvMod, 0.6f);  // three octaves
    device.set_param(p::kDecay, decay);
    device.note_on(1, static_cast<float>(kC0), 0.7f);
    Stereo out = render(device, decay * 2.5f + 0.5f, kRate);
    // Windows a tenth of the Decay long, centred on the time named.
    auto peak_at = [&](double fraction) {
      const double centre = fraction * decay, half = 0.05 * decay;
      return peak_harmonic(out.left, kC0, at(centre - half), at(centre + half));
    };
    auto expected = [&](double fraction) { return base * std::exp2(3.0 * std::pow(10.0, -fraction)); };
    const double early = peak_at(0.1), middle = peak_at(0.5), end = peak_at(1.0), after = peak_at(2.0);
    std::printf("filter envelope, Decay %.1f s: the peak stands at %.0f, %.0f, %.0f and %.0f Hz after 0.1, 0.5, "
                "1 and 2 Decays (%.0f, %.0f, %.0f, %.0f)\n",
                decay, early, middle, end, after, expected(0.1), expected(0.5), expected(1.0), expected(2.0));
    std::snprintf(label, sizeof label, "Decay %.1f s: the filter starts %.1f octaves above Cutoff (2.4)", decay,
                  std::log2(early / base));
    EXPECT(std::fabs(cents(early, expected(0.1))) < 200.0, label);
    std::snprintf(label, sizeof label, "Decay %.1f s: half way it is %.0f cents from where the fall puts it", decay,
                  cents(middle, expected(0.5)));
    EXPECT(std::fabs(cents(middle, expected(0.5))) < 200.0, label);
    std::snprintf(label, sizeof label, "Decay %.1f s: after Decay it is %.0f cents above Cutoff (360: a tenth left)",
                  decay, cents(end, base));
    EXPECT(std::fabs(cents(end, expected(1.0))) < 150.0, label);
    EXPECT(std::fabs(cents(after, base)) < 120.0, "and after two Decays it is back on Cutoff");
  }

  // Env Mod is the depth: none leaves the peak where Cutoff put it, full
  // opens five octaves.
  for (float depth : {0.0f, 1.0f}) {
    steady(device);
    device.set_param(p::kCutoff, 200.0f);
    device.set_param(p::kResonance, 0.8f);
    device.set_param(p::kEnvMod, depth);
    device.set_param(p::kDecay, 10.0f);
    device.note_on(1, static_cast<float>(kC0), 0.7f);
    Stereo out = render(device, 0.4f, kRate);
    const double where = peak_harmonic(out.left, kC0, at(0.05), at(0.35), 12000.0);
    // 0.2 s into a 10 s fall the envelope stands at 0.955.
    const double expected = 200.0 * std::exp2(5.0 * depth * 0.955);
    std::snprintf(label, sizeof label, "Env Mod %.0f: the peak stands at %.0f Hz 0.2 s after the strike (%.0f)", depth,
                  where, expected);
    EXPECT(std::fabs(cents(where, expected)) < 150.0, label);
  }

  // The filter's envelope is not the loudness envelope: a short Decay under
  // a long Sustain closes the filter and leaves the note sounding, and the
  // other way round the note is gone while the filter is still open.
  steady(device);
  device.set_param(p::kCutoff, 150.0f);
  device.set_param(p::kEnvMod, 0.8f);
  device.set_param(p::kDecay, 0.1f);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo closed = render(device, 1.0f, kRate);
  const double bright = centroid(closed.left, kA1, at(0.005), at(0.045));
  const double dark = centroid(closed.left, kA1, at(0.5), at(0.9));
  std::snprintf(label, sizeof label,
                "Decay 0.1 s under a held note: brightness falls from %.0f to %.0f Hz and the level stays (%.1f dB)",
                bright, dark, db(rms(closed.left, at(0.5), at(0.9)) / rms(closed.left, at(0.05), at(0.1))));
  EXPECT(bright > 2.0 * dark && rms(closed.left, at(0.5), at(0.9)) > 0.3 * rms(closed.left, at(0.05), at(0.1)), label);
  steady(device);
  device.set_param(p::kCutoff, 150.0f);
  device.set_param(p::kEnvMod, 0.8f);
  device.set_param(p::kDecay, 10.0f);
  device.set_param(p::kSustain, 0.5f);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo faded = render(device, 0.5f, kRate);
  const double start = centroid(faded.left, kA1, at(0.005), at(0.045));
  const double late = centroid(faded.left, kA1, at(0.3), at(0.4));
  std::snprintf(label, sizeof label,
                "Sustain 0.5 s under a 10 s Decay: the level falls %.1f dB in 0.3 s and the brightness stays (%.0f, %.0f Hz)",
                db(rms(faded.left, at(0.05), at(0.1)) / rms(faded.left, at(0.35), at(0.4))), start, late);
  EXPECT(late > 0.7 * start && rms(faded.left, at(0.35), at(0.4)) < 0.05 * rms(faded.left, at(0.05), at(0.1)), label);
}

// --- accents ------------------------------------------------------------------------------

// A note on a patch with the filter envelope and accent in play; `gap`
// seconds of rest after each 0.1 s key let the loudness envelope end, so each
// strike starts from rest and only the accent store tells them apart.
static void accent_patch(AcidBass& d, float accent, float decay, float rate = kRate) {
  steady(d, rate);
  d.set_param(p::kCutoff, 250.0f);
  d.set_param(p::kResonance, 0.5f);
  d.set_param(p::kEnvMod, 0.4f);
  d.set_param(p::kDecay, decay);
  d.set_param(p::kAccent, accent);
}

static void test_accent() {
  // Louder and brighter than a plain note, by stated amounts.
  accent_patch(device, 1.0f, 0.3f);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo plain = render(device, 1.0f, kRate);
  accent_patch(device, 1.0f, 0.3f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo accented = render(device, 1.0f, kRate);
  const double louder = db(rms(accented.left, at(0.4), at(0.9)) / rms(plain.left, at(0.4), at(0.9)));
  const double plain_bright = centroid(plain.left, kA1, at(0.02), at(0.1));
  const double accent_bright = centroid(accented.left, kA1, at(0.02), at(0.1));
  std::printf("accent: a full accent is %.1f dB louder, and %.2f octaves brighter in its first 0.1 s (%.0f against "
              "%.0f Hz)\n",
              louder, std::log2(accent_bright / plain_bright), accent_bright, plain_bright);
  EXPECT_NEAR(louder, 6.0, 1.0, "a full accent is 6 dB louder than a note at gain 0.7");
  std::snprintf(label, sizeof label, "a full accent is %.2f octaves brighter over its first 0.1 s (0.5 to 2)",
                std::log2(accent_bright / plain_bright));
  EXPECT(accent_bright > 1.41 * plain_bright && accent_bright < 4.0 * plain_bright, label);

  // The amount grows from gain 0.7 to gain 1, and with Accent. Under 0.7 a
  // note is plain whatever Accent says: only its level follows the gain.
  accent_patch(device, 1.0f, 0.3f);
  device.note_on(1, static_cast<float>(kA1), 0.85f);
  Stereo half = render(device, 1.0f, kRate);
  const double half_bright = centroid(half.left, kA1, at(0.02), at(0.1));
  const double half_louder = db(rms(half.left, at(0.4), at(0.9)) / rms(plain.left, at(0.4), at(0.9)));
  std::snprintf(label, sizeof label, "gain 0.85 is half an accent: %.1f dB louder and %.0f Hz bright, between %.0f and %.0f",
                half_louder, half_bright, plain_bright, accent_bright);
  EXPECT(half_louder > 2.0 && half_louder < louder - 1.5 && half_bright > 1.1 * plain_bright &&
             half_bright < 0.92 * accent_bright,
         label);
  accent_patch(device, 0.0f, 0.3f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo unaccented = render(device, 1.0f, kRate);
  const double velocity_only = db(rms(unaccented.left, at(0.4), at(0.9)) / rms(plain.left, at(0.4), at(0.9)));
  std::snprintf(label, sizeof label, "Accent 0: gain 1 is %.1f dB louder than gain 0.7 and no brighter (%.0f Hz)",
                velocity_only, centroid(unaccented.left, kA1, at(0.02), at(0.1)));
  EXPECT(velocity_only > 1.0 && velocity_only < 3.0 &&
             std::fabs(centroid(unaccented.left, kA1, at(0.02), at(0.1)) - plain_bright) < 0.02 * plain_bright,
         label);
  accent_patch(device, 1.0f, 0.3f);
  device.note_on(1, static_cast<float>(kA1), 0.4f);
  Stereo soft = render(device, 1.0f, kRate);
  const double softer = db(rms(soft.left, at(0.4), at(0.9)) / rms(plain.left, at(0.4), at(0.9)));
  std::snprintf(label, sizeof label, "gain 0.4 is %.1f dB under gain 0.7 and as bright (%.0f Hz)", softer,
                centroid(soft.left, kA1, at(0.02), at(0.1)));
  EXPECT(softer < -2.0 && softer > -6.0 &&
             std::fabs(centroid(soft.left, kA1, at(0.02), at(0.1)) - plain_bright) < 0.02 * plain_bright,
         label);

  // An accented note's filter falls fast whatever Decay says: with a 10 s
  // Decay the plain note is still open after 0.6 s and the accented one,
  // brighter at first, has closed under it.
  accent_patch(device, 1.0f, 10.0f);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo slow_plain = render(device, 1.0f, kRate);
  accent_patch(device, 1.0f, 10.0f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo slow_accent = render(device, 1.0f, kRate);
  const double plain_late = centroid(slow_plain.left, kA1, at(0.8), at(1.0));
  const double accent_late = centroid(slow_accent.left, kA1, at(0.8), at(1.0));
  const double plain_first = centroid(slow_plain.left, kA1, at(0.01), at(0.05));
  const double accent_first = centroid(slow_accent.left, kA1, at(0.01), at(0.05));
  std::printf("accent under a 10 s Decay: brightness %.0f Hz at first and %.0f Hz after 0.9 s; a plain note %.0f and "
              "%.0f Hz\n",
              accent_first, accent_late, plain_first, plain_late);
  EXPECT(accent_first > 1.2 * plain_first, "under a 10 s Decay an accent still starts brighter");
  EXPECT(accent_late < 0.6 * plain_late, "and has closed while the plain note is still open");
  EXPECT(plain_late > 0.75 * plain_first, "(the plain note has hardly moved in 0.9 s of a 10 s Decay)");

  // Accents add up. Four accented notes 0.15 s apart, each struck from rest
  // (the loudness envelope has ended), so only the store tells them apart:
  // it has not drained, and each opens further than the last. Then a rest of
  // 3 s and the next accent is the first one again, sample for sample.
  accent_patch(device, 1.0f, 0.3f);
  double brightness[4];
  Stereo first_hit, later_hit;
  for (int n = 0; n < 4; ++n) {
    device.note_on(n, static_cast<float>(kA1), 1.0f);
    Stereo note = render(device, 0.08f, kRate);
    device.note_off(n);
    Stereo rest = render(device, 0.07f, kRate);
    EXPECT(peak(rest.left, at(0.06)) == 0.0, "(the loudness envelope has ended before the next strike)");
    brightness[n] = centroid(note.left, kA1, at(0.02), at(0.08));
    if (n == 0) first_hit = note;
  }
  std::printf("accents in a row, 0.15 s apart: brightness %.0f, %.0f, %.0f, %.0f Hz\n", brightness[0], brightness[1],
              brightness[2], brightness[3]);
  std::snprintf(label, sizeof label, "accents in a row open further each time: %.0f, %.0f, %.0f, %.0f Hz",
                brightness[0], brightness[1], brightness[2], brightness[3]);
  EXPECT(brightness[1] > 1.1 * brightness[0] && brightness[2] > 1.04 * brightness[1] &&
             brightness[3] > brightness[2],
         label);
  render(device, 3.0f, kRate);
  device.note_on(9, static_cast<float>(kA1), 1.0f);
  later_hit = render(device, 0.08f, kRate);
  EXPECT(later_hit.left == first_hit.left, "after 3 s the store has drained: the accent is the first one again");

  // The store is the accent's alone: plain notes in a row do not add up, and
  // a plain note 0.15 s after an accent still finds the filter further open.
  accent_patch(device, 1.0f, 0.3f);
  Stereo plain_first_hit, plain_fourth_hit;
  for (int n = 0; n < 4; ++n) {
    device.note_on(n, static_cast<float>(kA1), 0.7f);
    Stereo note = render(device, 0.1f, kRate);
    device.note_off(n);
    render(device, 0.15f, kRate);
    if (n == 0) plain_first_hit = note;
    if (n == 3) plain_fourth_hit = note;
  }
  EXPECT(plain_first_hit.left == plain_fourth_hit.left, "plain notes in a row are all the same note");
  accent_patch(device, 1.0f, 0.3f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  render(device, 0.1f, kRate);
  device.note_off(1);
  render(device, 0.15f, kRate);
  device.note_on(2, static_cast<float>(kA1), 0.7f);
  Stereo carried = render(device, 0.1f, kRate);
  const double carried_bright = centroid(carried.left, kA1, at(0.02), at(0.1));
  const double alone_bright = centroid(plain_first_hit.left, kA1, at(0.02), at(0.1));
  std::snprintf(label, sizeof label, "a plain note 0.15 s after an accent is brighter than one alone (%.0f against %.0f Hz)",
                carried_bright, alone_bright);
  EXPECT(carried_bright > 1.1 * alone_bright, label);
}

// --- the oscillator -----------------------------------------------------------------------

// Square against saw: a sawtooth has every harmonic, falling as 1/n; a square
// has none of the even ones. Nothing is under the note (one oscillator, no sub).
static void test_waves() {
  steady(device);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo saw = render(device, 1.5f, kRate);
  steady(device);
  device.set_param(p::kWave, 1.0f);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo square = render(device, 1.5f, kRate);
  const size_t from = at(0.5);
  const double saw_one = tone_level(saw.left, kA1, kRate, from), square_one = tone_level(square.left, kA1, kRate, from);
  const double saw_two = db(tone_level(saw.left, 2 * kA1, kRate, from) / saw_one);
  const double saw_three = db(tone_level(saw.left, 3 * kA1, kRate, from) / saw_one);
  const double square_two = db(tone_level(square.left, 2 * kA1, kRate, from) / square_one);
  const double square_three = db(tone_level(square.left, 3 * kA1, kRate, from) / square_one);
  const double square_four = db(tone_level(square.left, 4 * kA1, kRate, from) / square_one);
  std::printf("waves: saw harmonics 2 and 3 at %.1f and %.1f dB; square 2, 3 and 4 at %.1f, %.1f and %.1f dB; the "
              "square's fundamental is %.1f dB from the saw's\n",
              saw_two, saw_three, square_two, square_three, square_four, db(square_one / saw_one));
  EXPECT_NEAR(saw_two, -6.0, 1.0, "Saw: the second harmonic is half the first");
  EXPECT_NEAR(saw_three, -9.5, 1.0, "Saw: the third is a third of it");
  EXPECT(square_two < -50.0 && square_four < -50.0, "Square: the even harmonics are gone");
  EXPECT_NEAR(square_three, -9.5, 1.0, "Square: the third is a third of the first");
  EXPECT(std::fabs(db(square_one / saw_one)) < 2.0, "the two waves are about as loud");
  EXPECT(tone_level(saw.left, kA1 / 2, kRate, from) < 0.001 * saw_one &&
             tone_level(square.left, kA1 / 2, kRate, from) < 0.001 * square_one,
         "nothing sounds an octave under the note");
  // One oscillator: the level of a held note does not beat. (The ladder bass
  // swings by several dB at its default Beat.)
  double lo = 1.0e9, hi = 0.0;
  steady(device);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo held = render(device, 8.0f, kRate);
  for (size_t start = at(0.5); start + 9600 <= held.size(); start += 4800) {
    const double value = rms(held.left, start, start + 9600);
    lo = std::min(lo, value);
    hi = std::max(hi, value);
  }
  std::snprintf(label, sizeof label, "a held note's level moves %.3f dB in 8 s (one oscillator: no beating)", db(hi / lo));
  EXPECT(db(hi / lo) < 0.05, label);
}

// --- keys: strikes and slides -------------------------------------------------------------

// The pitch of `x` around `seconds`, from a window of `width` seconds.
static double pitch_at(const std::vector<float>& x, double seconds, double lo, double hi, double width = 0.03) {
  return peak_frequency(x, kRate, lo, hi, at(seconds - width / 2), at(seconds + width / 2));
}

// The loudness envelope read off a render: rms over windows of `width` seconds.
static double level_at(const std::vector<float>& x, double seconds, double width = 0.02) {
  return rms(x, at(seconds - width / 2), at(seconds + width / 2));
}

static void test_keys() {
  // A key pressed while another is held slides to it: an exponential
  // approach that has covered 99 % of the interval after the Slide time.
  // C3 to C4 in 0.2 s: half way (600 cents left) after 30 ms, 12 cents left
  // at 0.2 s.
  steady(device);
  device.set_param(p::kSlide, 0.2f);
  device.note_on(1, static_cast<float>(kC3), 0.7f);
  Stereo first = render(device, 0.5f, kRate);
  EXPECT(std::fabs(cents(pitch_at(first.left, 0.03, 100.0, 300.0, 0.05), kC3)) < 10.0,
         "a key struck from silence starts on pitch, Slide or not");
  device.note_on(2, static_cast<float>(kC4), 0.7f);
  Stereo slide = render(device, 0.6f, kRate);
  auto left_at = [&](double seconds) { return -cents(pitch_at(slide.left, seconds, 120.0, 280.0), kC4); };
  auto expected_left = [](double seconds) { return 1200.0 * std::exp(-4.60517 * seconds / 0.2); };
  std::printf("slide of an octave in 0.2 s: %.0f, %.0f, %.0f and %.0f cents to go after 30, 60, 100 and 200 ms "
              "(%.0f, %.0f, %.0f, %.0f)\n",
              left_at(0.03), left_at(0.06), left_at(0.1), left_at(0.2), expected_left(0.03), expected_left(0.06),
              expected_left(0.1), expected_left(0.2));
  EXPECT_NEAR(left_at(0.03), expected_left(0.03), 90.0, "an octave slide is half way after 0.15 of its time");
  EXPECT_NEAR(left_at(0.06), expected_left(0.06), 60.0, "three quarters of the way after 0.3 of it");
  EXPECT_NEAR(left_at(0.1), expected_left(0.1), 40.0, "a tenth of the interval left at half time");
  EXPECT(std::fabs(left_at(0.2)) < 25.0, "and arrived (within 25 cents) at the Slide time");
  EXPECT(std::fabs(left_at(0.4)) < 3.0, "then it stays on the new key");
  EXPECT(tone_level(slide.left, kC3, kRate, at(0.4)) < 0.003 * tone_level(slide.left, kC4, kRate, at(0.4)),
         "two keys held: one voice, only the newer key sounds");
  // Slide is the time: a tenth of it, a tenth of the way.
  for (float seconds : {0.05f, 1.0f}) {
    steady(device);
    device.set_param(p::kSlide, seconds);
    device.note_on(1, static_cast<float>(kC3), 0.7f);
    render(device, 0.3f, kRate);
    device.note_on(2, static_cast<float>(kC4), 0.7f);
    Stereo out = render(device, seconds * 1.5f + 0.1f, kRate);
    const double half = -cents(pitch_at(out.left, 0.5 * seconds, 120.0, 280.0, 0.02), kC4);
    const double end = -cents(pitch_at(out.left, seconds + 0.02, 120.0, 280.0, 0.03), kC4);
    std::snprintf(label, sizeof label, "Slide %.2f s: %.0f cents to go at half time (120) and %.0f at the end", seconds,
                  half, end);
    EXPECT(std::fabs(half - 120.0) < 70.0 && std::fabs(end) < 20.0, label);
  }
  // And the slide arrives, however slow, on any key and at any sample rate:
  // four Slide times on, the pitch is the key's. (With the pitch kept in
  // single precision the last steps of a slow slide round to nothing and it
  // stays short of the key for good: 3 cents under C4 and 6 above at 48 kHz
  // with a 1 s Slide, four times that at 192 kHz.)
  for (float rate : {48000.0f, 192000.0f}) {
    for (double hz : {kA1, kC5}) {
      steady(device, rate);
      device.set_param(p::kSlide, 1.0f);
      device.note_on(1, static_cast<float>(hz * 1.5), 0.7f);
      render(device, 0.1f, rate);
      device.note_on(2, static_cast<float>(hz), 0.7f);
      render(device, 4.0f, rate);
      Stereo out = render(device, static_cast<float>(std::max(0.25, 60.0 / hz)), rate);
      const double off = cents(peak_frequency(out.left, rate, hz * 0.985, hz * 1.015, 0, out.size()), hz);
      std::snprintf(label, sizeof label, "4 s after a 1 s slide down a fifth to %.1f Hz at %.0f Hz: %.2f cents off the key (0.5)", hz,
                    rate, off);
      EXPECT(std::fabs(off) < 0.5, label);
    }
  }

  // A tied key is heard. With a 1 s Sustain the note is 30 dB down after
  // half a second; a key pressed over it then brings the loudness back to
  // full and its fall starts again: 30 ms on it is within 1 dB of a struck
  // note 30 ms after its strike, and it stays there. Its pitch arrives as any
  // slide's does. (The filter is open, so the level of the sawtooth does not
  // depend on the key; the volume is down so that the soft clip's knee is far
  // above and the loudness can be read off the output.)
  auto fading = [](AcidBass& d, double hz) {
    steady(d);
    d.set_param(p::kSustain, 1.0f);
    d.set_param(p::kSlide, 0.05f);
    d.set_param(p::kVolume, -12.0f);
    d.note_on(1, static_cast<float>(hz), 0.7f);
  };
  fading(device, kC3);
  Stereo before = render(device, 0.5f, kRate);
  device.note_on(2, static_cast<float>(kC4), 0.7f);
  Stereo over = render(device, 0.5f, kRate);
  fading(device, kC3);
  render(device, 0.5f, kRate);
  device.note_off(1);
  device.note_on(2, static_cast<float>(kC4), 0.7f);
  Stereo apart = render(device, 0.5f, kRate);
  fading(device, kC4);
  Stereo struck_c4 = render(device, 0.5f, kRate);
  const double faded = db(level_at(before.left, 0.49) / level_at(before.left, 0.03));
  const double tied = db(level_at(over.left, 0.03) / level_at(struck_c4.left, 0.03));
  const double tied_later = db(level_at(over.left, 0.3) / level_at(struck_c4.left, 0.3));
  const double restruck = db(level_at(apart.left, 0.03) / level_at(struck_c4.left, 0.03));
  std::printf("a key tied over a note that has fallen %.1f dB: %+.2f dB of a struck note 30 ms on and %+.2f dB 0.3 s on; "
              "played apart: %+.2f dB\n",
              faded, tied, tied_later, restruck);
  EXPECT(faded < -27.0, "(the held note had fallen 27 dB or more before the tie)");
  std::snprintf(label, sizeof label, "30 ms after a tie the level is %+.2f dB of a struck note's 30 ms after its strike (1)",
                tied);
  EXPECT(std::fabs(tied) < 1.0, label);
  std::snprintf(label, sizeof label, "and it falls from full again: %+.2f dB of the struck note's 0.3 s on (1)", tied_later);
  EXPECT(std::fabs(tied_later) < 1.0, label);
  EXPECT(std::fabs(restruck) < 1.0, "the same key played apart strikes at full level");
  const double half_way = -cents(pitch_at(over.left, 0.025, 120.0, 280.0, 0.02), kC4);
  const double arrived = cents(pitch_at(over.left, 0.2, 200.0, 300.0, 0.1), kC4);
  std::snprintf(label, sizeof label, "the tied key's pitch: %.0f cents to go at half the Slide time (120), %.2f off 0.2 s on",
                half_way, arrived);
  EXPECT(std::fabs(half_way - 120.0) < 70.0 && std::fabs(arrived) < 3.0, label);

  // The rise is the tie's own: 8 ms from wherever the fall has got to, not
  // the 2 ms of a strike, and never a step. A key of the same pitch and gain
  // tied over the fading note changes nothing but the loudness, so the two
  // renders divide to the loudness envelope itself, here in windows of a
  // quarter of a millisecond. (The note left alone is 30 dB down and falls
  // 60 dB a second.)
  fading(device, kC3);
  render(device, 0.5f, kRate);
  device.note_on(2, static_cast<float>(kC3), 0.7f);
  Stereo same = render(device, 0.1f, kRate);
  fading(other, kC3);
  render(other, 0.5f, kRate);
  Stereo left_alone = render(other, 0.1f, kRate);
  auto loudness = [&](int window) {  // of full, in the 12 samples from window / 4 ms after the tie
    const size_t from = static_cast<size_t>(window) * 12;
    const double seconds = 0.5 - 0.002 + (static_cast<double>(from) + 6.0) / kRate;
    return rms(same.left, from, from + 12) / rms(left_alone.left, from, from + 12) * std::pow(10.0, -3.0 * seconds);
  };
  double steepest = 0.0;
  bool falls_back = false;
  for (int window = 1; window < 40; ++window) {
    steepest = std::max(steepest, loudness(window) - loudness(window - 1));
    if (window <= 28 && loudness(window) < loudness(window - 1) - 0.002) falls_back = true;
  }
  std::printf("a tie's rise from 30 dB down: %.2f of full after 1 ms, %.2f after 3 ms, %.2f after 5 ms, %.2f after 10 ms; "
              "at most %.3f of full in a quarter of a millisecond\n",
              loudness(4), loudness(12), loudness(20), loudness(40), steepest);
  std::snprintf(label, sizeof label,
                "a tie rises over 8 ms: %.2f of full after 1 ms (0.27), %.2f after 3 ms (0.59), %.2f after 5 ms (0.81), "
                "%.2f after 10 ms (0.98)",
                loudness(4), loudness(12), loudness(20), loudness(40));
  EXPECT(loudness(4) > 0.18 && loudness(4) < 0.34 && loudness(12) > 0.5 && loudness(12) < 0.66 && loudness(20) > 0.72 &&
             loudness(20) < 0.9 && loudness(40) > 0.94 && loudness(40) < 1.02,
         label);
  std::snprintf(label, sizeof label, "and smoothly: at most %.3f of full from one quarter of a millisecond to the next (0.08)",
                steepest);
  EXPECT(steepest < 0.08 && !falls_back, label);

  // Letting the tied key go again slides back to the key under it and
  // strikes nothing, the loudness included (no key was pressed): 0.1 s later
  // the level is where the tied note's fall had it.
  fading(device, kC3);
  render(device, 0.5f, kRate);
  device.note_on(2, static_cast<float>(kC4), 0.7f);
  render(device, 0.2f, kRate);
  device.note_off(2);
  Stereo back_down = render(device, 0.2f, kRate);
  const double back_level = db(level_at(back_down.left, 0.1, 0.04) / level_at(over.left, 0.3, 0.04));
  const double back_pitch = cents(pitch_at(back_down.left, 0.15, 100.0, 200.0, 0.08), kC3);
  std::snprintf(label, sizeof label,
                "the tied key let go: 0.1 s on the level is %+.2f dB of the tied note's own fall (1), %.1f cents off the "
                "key under it",
                back_level, back_pitch);
  EXPECT(std::fabs(back_level) < 1.0 && std::fabs(back_pitch) < 3.0, label);

  // A tie strikes the loudness and nothing else. Over a note that holds, a
  // key of the same pitch and gain therefore changes nothing at all: the
  // filter envelope (here half way down its fall), the accent store and the
  // oscillator are where they were, sample for sample.
  auto ringing = [](AcidBass& d) {
    steady(d);
    d.set_param(p::kCutoff, 200.0f);
    d.set_param(p::kResonance, 0.5f);
    d.set_param(p::kEnvMod, 0.6f);
    d.set_param(p::kDecay, 0.4f);
    d.set_param(p::kAccent, 1.0f);
    d.set_param(p::kVolume, -9.0f);
    d.note_on(1, static_cast<float>(kA1), 0.7f);
    render(d, 0.15f, kRate);
  };
  ringing(device);
  device.note_on(2, static_cast<float>(kA1), 0.7f);
  Stereo tied_same = render(device, 0.4f, kRate);
  ringing(other);
  Stereo untouched = render(other, 0.4f, kRate);
  EXPECT(tied_same.left == untouched.left && peak(untouched.left) > 0.05,
         "the same key tied over a holding note changes nothing: filter envelope, accent and oscillator carry on");
  // A hard key tied over it is louder, as a harder key is, but it is no
  // accent: the harmonics stand where they do on the note left alone, while
  // the same key struck apart moves them by several dB (an accent's filter
  // opens further and closes faster).
  ringing(device);
  device.note_on(2, static_cast<float>(kA1), 1.0f);
  Stereo tied_hard = render(device, 0.4f, kRate);
  ringing(device);
  device.note_off(1);
  device.note_on(2, static_cast<float>(kA1), 1.0f);
  Stereo struck_hard = render(device, 0.4f, kRate);
  double tie_moves = 0.0, strike_moves = 0.0;
  for (int n = 3; n <= 8; ++n) {
    const double alone = filter_gain_db(untouched.left, kA1, n, at(0.02), at(0.12));
    tie_moves = std::max(tie_moves, std::fabs(filter_gain_db(tied_hard.left, kA1, n, at(0.02), at(0.12)) - alone));
    strike_moves = std::max(strike_moves, std::fabs(filter_gain_db(struck_hard.left, kA1, n, at(0.02), at(0.12)) - alone));
  }
  const double tie_louder = db(rms(tied_hard.left, at(0.02), at(0.12)) / rms(untouched.left, at(0.02), at(0.12)));
  std::snprintf(label, sizeof label,
                "a hard key tied over a held one: %+.1f dB, harmonics 3 to 8 within %.2f dB of the note left alone (0.2); "
                "struck apart they move by up to %.1f dB (3 or more)",
                tie_louder, tie_moves, strike_moves);
  EXPECT(tie_louder > 3.0 && tie_moves < 0.2 && strike_moves > 3.0, label);
  std::printf("%s\n", label);
  // Nor does it charge the accent store: the next note from rest is the note
  // it would have been with no tie, sample for sample; after a hard key
  // struck apart it is not.
  auto hit_after = [&](int what) {
    ringing(device);
    if (what == 1) device.note_on(2, static_cast<float>(kA1), 1.0f);
    if (what == 2) {
      device.note_off(1);
      device.note_on(2, static_cast<float>(kA1), 1.0f);
    }
    render(device, 0.15f, kRate);
    device.note_off(1);
    device.note_off(2);
    Stereo rest = render(device, 0.07f, kRate);
    EXPECT(peak(rest.left, at(0.06)) == 0.0, "(the note has ended before the next strike)");
    device.note_on(3, static_cast<float>(kA1), 0.7f);
    return render(device, 0.1f, kRate);
  };
  Stereo after_nothing = hit_after(0), after_tie = hit_after(1), after_accent = hit_after(2);
  EXPECT(after_tie.left == after_nothing.left, "a hard tied key charges no accent: the next note is as if it had not been");
  EXPECT(!(after_accent.left == after_nothing.left), "(a hard key struck apart does: the next note differs)");

  // Nor does the filter open again: 40 ms after a key pressed over a held
  // one the tone is as dark as the held note had become; played apart it is
  // a strike, and bright.
  auto closing = [](AcidBass& d) {
    steady(d);
    d.set_param(p::kCutoff, 200.0f);
    d.set_param(p::kEnvMod, 0.6f);
    d.set_param(p::kDecay, 0.2f);
    d.set_param(p::kSlide, 0.01f);
    d.note_on(1, static_cast<float>(kA1), 0.7f);
  };
  closing(device);
  render(device, 0.6f, kRate);
  device.note_on(2, static_cast<float>(kA2), 0.7f);
  Stereo dark_slide = render(device, 0.2f, kRate);
  closing(device);
  render(device, 0.6f, kRate);
  device.note_off(1);
  device.note_on(2, static_cast<float>(kA2), 0.7f);
  Stereo bright_strike = render(device, 0.2f, kRate);
  const double slid_bright = centroid(dark_slide.left, kA2, at(0.02), at(0.06));
  const double apart_bright = centroid(bright_strike.left, kA2, at(0.02), at(0.06));
  std::printf("the filter 40 ms after a second key: brightness %.0f Hz over a held key, %.0f Hz played apart\n", slid_bright,
              apart_bright);
  std::snprintf(label, sizeof label, "brightness 40 ms on: %.0f Hz slid, %.0f Hz struck (the filter opens on a strike only)",
                slid_bright, apart_bright);
  EXPECT(apart_bright > 2.0 * slid_bright, label);

  // Letting the top key go slides back to the one under it, with no strike;
  // letting an older key go changes nothing; the last key up ends the note.
  steady(device);
  device.set_param(p::kSlide, 0.1f);
  device.note_on(1, static_cast<float>(kC3), 0.7f);
  render(device, 0.3f, kRate);
  device.note_on(2, static_cast<float>(kC4), 0.7f);
  Stereo up = render(device, 0.5f, kRate);
  device.note_off(2);
  Stereo back = render(device, 0.5f, kRate);
  const double on_the_way = cents(pitch_at(back.left, 0.02, 120.0, 280.0, 0.02), kC3);
  std::snprintf(label, sizeof label, "top key released: %.0f cents above the key under it after 20 ms, %.1f at 0.3 s",
                on_the_way, cents(pitch_at(back.left, 0.3, 120.0, 280.0, 0.1), kC3));
  EXPECT(on_the_way > 300.0 && on_the_way < 700.0 && std::fabs(cents(pitch_at(back.left, 0.3, 120.0, 280.0, 0.1), kC3)) < 3.0,
         label);
  EXPECT(std::fabs(db(level_at(back.left, 0.3) / level_at(up.left, 0.3))) < 1.0, "which is still sounding at its level");
  device.note_on(3, static_cast<float>(kC4), 0.7f);
  render(device, 0.5f, kRate);
  device.note_off(1);
  Stereo kept = render(device, 0.3f, kRate);
  EXPECT(std::fabs(cents(pitch_at(kept.left, 0.15, 120.0, 280.0, 0.2), kC4)) < 3.0,
         "releasing an older key leaves the playing one alone");
  device.note_off(3);
  Stereo ended = render(device, 0.3f, kRate);
  EXPECT(peak(ended.left, at(0.1)) == 0.0, "the last key up ends the note");

  // Keys that land in the same instant (a chord in a score) do not slide:
  // nothing has sounded yet to slide from.
  device.note_on(5, static_cast<float>(kC3), 0.7f);
  device.note_on(6, static_cast<float>(kC4), 0.7f);
  Stereo chord = render(device, 0.2f, kRate);
  EXPECT(std::fabs(cents(pitch_at(chord.left, 0.03, 120.0, 280.0, 0.04), kC4)) < 10.0,
         "two keys in the same instant: the newer one sounds at once, without a slide");
  device.note_off(5);
  device.note_off(6);
  render(device, 0.3f, kRate);

  // A held key whose note has faded to nothing is no note to slide from: the
  // next key strikes, on pitch. (Otherwise a key left down would mute the
  // instrument.)
  steady(device);
  device.set_param(p::kSustain, 0.2f);
  device.set_param(p::kSlide, 0.3f);
  device.note_on(1, static_cast<float>(kC3), 0.7f);
  Stereo short_note = render(device, 0.6f, kRate);
  EXPECT(peak(short_note.left, at(0.5)) == 0.0, "a held key with a 0.2 s Sustain is exact silence after half a second");
  device.note_on(2, static_cast<float>(kC4), 0.7f);
  Stereo woken = render(device, 0.2f, kRate);
  std::snprintf(label, sizeof label, "a key over a held, silent one strikes: %.1f dB of the first strike, %.0f cents off pitch",
                db(level_at(woken.left, 0.03) / level_at(short_note.left, 0.03)),
                cents(pitch_at(woken.left, 0.03, 120.0, 280.0, 0.04), kC4));
  EXPECT(std::fabs(db(level_at(woken.left, 0.03) / level_at(short_note.left, 0.03))) < 2.0 &&
             std::fabs(cents(pitch_at(woken.left, 0.03, 120.0, 280.0, 0.04), kC4)) < 10.0,
         label);

  // Sixteen keys fit on the stack; a seventeenth forgets the oldest, and
  // every key let go in any order leaves silence.
  steady(device);
  for (int n = 0; n < 20; ++n) device.note_on(n, static_cast<float>(kC3 * std::pow(2.0, n / 12.0)), 0.7f);
  render(device, 0.3f, kRate);
  for (int n = 19; n >= 4; --n) device.note_off(n);
  Stereo stack = render(device, 0.3f, kRate);
  EXPECT(peak(stack.left, at(0.2)) == 0.0, "a full stack forgets its oldest keys: when the sixteen newest are up the note ends");
}

// --- the loudness envelope ----------------------------------------------------------------

static void test_loudness() {
  // Sustain: 60 dB down after its time while the key is held, then exact
  // silence with the key still down.
  for (float sustain : {0.3f, 3.0f}) {
    steady(device);
    device.set_param(p::kSustain, sustain);
    device.note_on(1, static_cast<float>(kA2), 0.7f);
    Stereo out = render(device, sustain * 1.2f + 0.2f, kRate);
    const double measured = rt60(out.left, kRate, 0.01, sustain / 20.0, -80.0);
    std::snprintf(label, sizeof label, "Sustain %.1f s: a held note is 60 dB down after %.3f s", sustain, measured);
    EXPECT(std::fabs(measured - sustain) < 0.1 * sustain, label);
    render(device, sustain, kRate);
    Stereo spent = render(device, 0.3f, kRate);
    EXPECT(peak(spent.left) == 0.0, "a note that has faded is exact silence while its key is held");
  }

  // At the top it holds: within half a dB after 30 s.
  steady(device);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo held = render(device, 31.0f, kRate);
  const double start = rms(held.left, at(0.5), at(1.5));
  const double end = rms(held.left, at(29.5), at(30.5));
  std::printf("loudness: a note held 30 s with Sustain at the top is %.3f dB from where it started\n", db(end / start));
  EXPECT(std::fabs(db(end / start)) < 0.5, "Sustain at the top holds for as long as the key is down");
  // Just under the top it does not: 19 s is a fall.
  steady(device);
  device.set_param(p::kSustain, 19.0f);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo long_fall = render(device, 10.0f, kRate);
  const double fallen = db(rms(long_fall.left, at(9.0), at(10.0)) / rms(long_fall.left, at(0.0), at(1.0)));
  std::snprintf(label, sizeof label, "Sustain 19 s: %.1f dB down between the first second and the tenth (28.4)", fallen);
  EXPECT_NEAR(fallen, -60.0 * 9.0 / 19.0, 1.5, label);

  // The strike: 2 ms, and never a step. Read as the envelope a held 2 kHz
  // sine-like tone would show: here, the rms in 0.25 ms windows of a bright
  // note against its level 5 ms on.
  steady(device);
  device.note_on(1, static_cast<float>(kC6), 0.7f);
  Stereo strike = render(device, 0.05f, kRate);
  const double full = rms(strike.left, at(0.01), at(0.03));
  const double at_half_ms = rms(strike.left, at(0.0004), at(0.0008)) / full;
  const double at_3_ms = rms(strike.left, at(0.003), at(0.004)) / full;
  std::snprintf(label, sizeof label, "the strike: %.2f of full level after 0.6 ms, %.2f after 3.5 ms", at_half_ms, at_3_ms);
  EXPECT(at_half_ms > 0.15 && at_half_ms < 0.6 && at_3_ms > 0.9, label);

  // The release is the envelope's own: 40 dB down 16 ms after the key goes
  // up whatever Sustain says, and exact silence within 60 ms. The length of
  // the key is the length of the note.
  for (float sustain : {0.5f, 20.0f}) {
    steady(device);
    device.set_param(p::kSustain, sustain);
    device.note_on(1, static_cast<float>(kC5), 0.7f);
    Stereo on = render(device, 0.1f, kRate);
    device.note_off(1);
    Stereo off = render(device, 0.2f, kRate);
    const double before = rms(on.left, at(0.09), at(0.1));
    const double at_8 = db(rms(off.left, at(0.006), at(0.010)) / before);
    const double at_16 = db(rms(off.left, at(0.014), at(0.018)) / before);
    std::snprintf(label, sizeof label, "Sustain %.1f s: the release is %.1f dB down after 8 ms and %.1f after 16 ms", sustain,
                  at_8, at_16);
    EXPECT(at_8 < -14.0 && at_8 > -26.0 && at_16 < -34.0 && at_16 > -46.0, label);
    EXPECT(peak(off.left, at(0.06)) == 0.0, "and exact silence 60 ms after the key");
    if (sustain == 20.0f) std::printf("loudness: the release is %.1f dB down after 8 ms and %.1f dB after 16 ms\n", at_8, at_16);
  }
}

// --- Drive --------------------------------------------------------------------------------

static void test_drive() {
  // The level is made good: within 2 dB of the clean note over dark and
  // bright, plain and resonant patches, both waves, at every quarter of the
  // way.
  double lowest = 1.0e9, highest = -1.0e9;
  int patches = 0;
  for (float resonance : {0.0f, 0.4f, 0.8f}) {
    for (float cutoff : {80.0f, 150.0f, 300.0f, 3000.0f}) {
      for (float wave : {0.0f, 1.0f}) {
        double clean = 0.0;
        for (float drive : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
          steady(device);
          device.set_param(p::kWave, wave);
          device.set_param(p::kCutoff, cutoff);
          device.set_param(p::kResonance, resonance);
          device.set_param(p::kDrive, drive);
          device.note_on(1, static_cast<float>(kA1), 0.7f);
          Stereo out = render(device, 1.0f, kRate);
          const double level = db(rms(out.left, at(0.5)));
          if (drive == 0.0f) clean = level;
          lowest = std::min(lowest, level - clean);
          highest = std::max(highest, level - clean);
        }
        ++patches;
      }
    }
  }
  std::printf("drive: over %d patches the level stays within %+.2f..%+.2f dB of the clean note\n", patches, lowest, highest);
  std::snprintf(label, sizeof label, "Drive keeps the level within 2 dB (%+.2f..%+.2f)", lowest, highest);
  EXPECT(lowest > -2.0 && highest < 2.0, label);

  // And it distorts: a nearly pure tone (a square on A1 with the filter and
  // its resonance on the fundamental, which leaves everything from the third
  // harmonic up 37 dB under it) grows harmonics, more with every quarter of
  // the way; at 0 the note is clean.
  double buzz[5];
  const float settings[5] = {0.0f, 0.25f, 0.5f, 0.75f, 1.0f};
  for (int i = 0; i < 5; ++i) {
    steady(device);
    device.set_param(p::kWave, 1.0f);
    device.set_param(p::kCutoff, 55.0f);
    device.set_param(p::kResonance, 0.6f);
    device.set_param(p::kDrive, settings[i]);
    device.note_on(1, static_cast<float>(kA1), 0.7f);
    Stereo out = render(device, 1.0f, kRate);
    buzz[i] = upper_harmonics_db(out.left, kA1, at(0.5));
  }
  std::printf("drive: the harmonics of a nearly pure tone stand at %.1f, %.1f, %.1f, %.1f and %.1f dB at Drive 0, "
              "0.25, 0.5, 0.75 and 1\n",
              buzz[0], buzz[1], buzz[2], buzz[3], buzz[4]);
  EXPECT(buzz[0] < -35.0, "Drive 0 is clean: a nearly pure tone stays one");
  EXPECT(buzz[1] > buzz[0] + 15.0 && buzz[2] > buzz[1] + 5.0 && buzz[3] > buzz[2] + 0.5 && buzz[4] > buzz[3] &&
             buzz[4] > -18.0,
         "Drive adds harmonics, more with every quarter of its travel");

  // The lower half of the travel is heard, on sounds as they are played and
  // not only on a pure tone. (The gain in dB follows d(2 - d). Straight in
  // d, half way stayed under the curve's knee: the three figures below were
  // x1.09, 3.2 dB and x1.05.) Drive is before the loudness envelope, so a
  // fading note serves.
  auto half_against_none = [](const std::function<void(AcidBass&)>& patch, double hz, float seconds,
                              const std::function<double(const std::vector<float>&)>& measure, double* none,
                              double* half) {
    for (float drive : {0.0f, 0.5f}) {
      patch(device);
      device.set_param(p::kDrive, drive);
      device.note_on(1, static_cast<float>(hz), 0.7f);
      Stereo out = render(device, seconds, kRate);
      (drive == 0.0f ? *none : *half) = measure(out.left);
    }
  };
  double none = 0.0, half = 0.0;
  // The default patch on A1 once its filter has closed: brightness.
  half_against_none([](AcidBass& d) { d.init(kRate); }, kA1, 2.2f,
                    [](const std::vector<float>& x) { return centroid(x, kA1, at(1.2), at(2.2)); }, &none, &half);
  std::snprintf(label, sizeof label, "Drive at half on the default patch, filter closed: brightness %.0f Hz against %.0f Hz clean (x%.2f, 1.25 or more)",
                half, none, half / none);
  EXPECT(half > 1.25 * none, label);
  std::printf("drive: %s\n", label);
  // A dark held square on A2 (the filter under the note): harmonics 2 to 8
  // against the fundamental.
  half_against_none(
      [](AcidBass& d) {
        steady(d);
        d.set_param(p::kWave, 1.0f);
        d.set_param(p::kCutoff, 90.0f);
        d.set_param(p::kResonance, 0.25f);
        d.set_param(p::kEnvMod, 0.08f);
        d.set_param(p::kDecay, 2.0f);
      },
      kA2, 2.0f,
      [](const std::vector<float>& x) {
        double sum = 0.0;
        for (int n = 2; n <= 8; ++n) {
          const double level = tone_level(x, n * kA2, kRate, at(1.0), at(2.0));
          sum += level * level;
        }
        return db(std::sqrt(sum) / tone_level(x, kA2, kRate, at(1.0), at(2.0)));
      },
      &none, &half);
  std::snprintf(label, sizeof label, "Drive at half on a dark held square: harmonics 2 to 8 at %.1f dB against %.1f dB clean (8 dB or more up)",
                half, none);
  EXPECT(half > none + 8.0, label);
  std::printf("drive: %s\n", label);
  // An open, bright sawtooth: brightness again.
  half_against_none(
      [](AcidBass& d) {
        steady(d);
        d.set_param(p::kCutoff, 2200.0f);
        d.set_param(p::kResonance, 0.2f);
      },
      kA1, 1.5f, [](const std::vector<float>& x) { return centroid(x, kA1, at(0.5), at(1.5)); }, &none, &half);
  std::snprintf(label, sizeof label, "Drive at half on an open sawtooth: brightness %.0f Hz against %.0f Hz clean (x%.2f, 1.12 or more)",
                half, none, half / none);
  EXPECT(half > 1.12 * none, label);
  std::printf("drive: %s\n", label);

  // It comes after the filter and before the loudness envelope: the fall of
  // a driven note is still 60 dB in the Sustain time.
  steady(device);
  device.set_param(p::kDrive, 1.0f);
  device.set_param(p::kSustain, 1.0f);
  device.note_on(1, static_cast<float>(kA2), 0.7f);
  Stereo fall = render(device, 1.3f, kRate);
  const double measured = rt60(fall.left, kRate, 0.01, 0.05, -80.0);
  std::snprintf(label, sizeof label, "full Drive, Sustain 1 s: 60 dB down after %.3f s", measured);
  EXPECT(std::fabs(measured - 1.0) < 0.1, label);

  // Nothing folds back: with everything that makes harmonics turned up,
  // whatever is not a harmonic is 72 dB under the fundamental at C4 and C5,
  // at every sample rate. (At twice the rate instead of four times it is
  // 65 dB at 44.1 kHz: the bound is set between the two.)
  double worst = 1.0e9;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (double hz : {kC4, kC5}) {
      for (float wave : {0.0f, 1.0f}) {
        steady(device, rate);
        device.set_param(p::kWave, wave);
        device.set_param(p::kDrive, 1.0f);
        device.set_param(p::kResonance, 0.7f);
        device.set_param(p::kVolume, -9.0f);  // under the soft clip, which makes harmonics of its own
        device.note_on(1, static_cast<float>(hz), 0.7f);
        Stereo out = render(device, 1.3f, rate);
        double where = 0.0;
        const double down = -db(stray_level(out.left, hz, rate, at(0.5, rate), &where));
        worst = std::min(worst, down);
        std::snprintf(label, sizeof label,
                      "%.0f Hz, full Drive, wave %.0f at %.0f Hz: the loudest stray component is %.1f dB down, at %.0f Hz",
                      hz, wave, rate, down, where);
        EXPECT(down > 72.0, label);
        if (std::getenv("ACID_VERBOSE")) std::printf("  %s\n", label);
      }
    }
  }
  std::printf("drive: full Drive with resonance at C4 and C5: whatever is not a harmonic is at least %.1f dB down\n", worst);
}

// --- from rest, across sleep, at any block size ------------------------------------------

// Render in blocks of mixed sizes.
static Stereo render_ragged(AcidBass& d, float seconds) {
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  Stereo out;
  const size_t total = static_cast<size_t>(seconds * kRate);
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0;
  int which = 0;
  while (done < total) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), total - done));
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

static void test_from_rest() {
  // Every hit from rest is the same hit, sample for sample: the oscillator,
  // the filter and both envelopes start from the same place, however long
  // the rest was and whatever was played before it.
  device.init(kRate);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo first = render(device, 0.3f, kRate);
  device.note_off(1);
  for (float rest : {0.06f, 0.1f, 1.0f}) {
    render(device, rest, kRate);
    device.note_on(2, static_cast<float>(kA1), 0.7f);
    Stereo again = render(device, 0.3f, kRate);
    device.note_off(2);
    std::snprintf(label, sizeof label, "a strike after %.2f s of rest differs from the first by %g (0)", rest,
                  difference(first, again));
    EXPECT(again.left == first.left, label);
  }
  // Whatever came before: another key, a slide, another wave under a long filter fall.
  render(device, 0.2f, kRate);
  device.set_param(p::kDecay, 10.0f);
  device.note_on(3, static_cast<float>(kC4), 0.6f);
  render(device, 0.2f, kRate);
  device.note_on(4, static_cast<float>(kC2), 0.5f);
  render(device, 0.2f, kRate);
  device.note_off(3);
  device.note_off(4);
  render(device, 0.1f, kRate);
  device.set_param(p::kDecay, p::kParamDefault[p::kDecay]);
  device.note_on(5, static_cast<float>(kA1), 0.7f);
  Stereo after_phrase = render(device, 0.3f, kRate);
  EXPECT(after_phrase.left == first.left, "a strike from rest is the same after a phrase on other keys");
  // (Not from rest it is another hit: struck 10 ms after the key before it,
  // the oscillator carries on from where it was.)
  device.note_off(5);
  render(device, 0.01f, kRate);
  device.note_on(6, static_cast<float>(kA1), 0.7f);
  Stereo over_tail = render(device, 0.3f, kRate);
  EXPECT(difference(over_tail, first) > 0.01, "a strike over the release of the last note carries on from it");

  // A knob moved in the silence has arrived when the next note starts: the
  // note is the one a device set that way from the start plays. The device
  // is put to sleep off the beat of its control clock first.
  const int moved[] = {p::kWave, p::kCutoff, p::kResonance, p::kEnvMod, p::kDecay, p::kSustain, p::kDrive, p::kVolume};
  const float values[] = {1.0f, 1200.0f, 0.2f, 0.9f, 1.5f, 0.4f, 0.9f, -20.0f};
  device.init(kRate);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  render(device, 0.1f, kRate);
  device.process(13);
  device.note_off(1);
  render(device, 0.5f, kRate);
  for (int i = 0; i < 8; ++i) device.set_param(moved[i], values[i]);
  render(device, 0.2f, kRate);
  device.note_on(2, static_cast<float>(kA2), 0.7f);
  Stereo woken = render(device, 0.5f, kRate);
  other.init(kRate);
  for (int i = 0; i < 8; ++i) other.set_param(moved[i], values[i]);
  other.note_on(2, static_cast<float>(kA2), 0.7f);
  Stereo fresh = render(other, 0.5f, kRate);
  std::snprintf(label, sizeof label, "eight knobs moved while asleep: the next note differs from a fresh device's by %g (0)",
                difference(woken, fresh));
  EXPECT(woken.left == fresh.left, label);

  // The audio does not depend on the block size, across rests of every
  // length around the release and the sleep that follows it, with a knob
  // moved inside the rest and an accent before it (its store is still
  // draining when the next note comes).
  double worst = 0.0;
  int phrases = 0;
  for (float rest = 0.02f; rest < 0.23f; rest += 0.01f) {
    Stereo reference;
    for (int block : {128, 1, 2048, 0}) {
      auto run_for = [&](float seconds) { return block == 0 ? render_ragged(device, seconds) : render(device, seconds, kRate, block); };
      device.init(kRate);
      device.note_on(1, static_cast<float>(kA1), 1.0f);
      Stereo out = run_for(0.08f);
      device.note_on(2, static_cast<float>(kA2), 0.6f);
      out = concat(out, run_for(0.07f));
      device.note_off(2);
      device.note_off(1);
      out = concat(out, run_for(rest));
      device.set_param(p::kCutoff, 600.0f);
      device.set_param(p::kVolume, -14.0f);
      out = concat(out, run_for(0.005f));
      device.note_on(3, static_cast<float>(kC3), 0.7f);
      out = concat(out, run_for(0.15f));
      if (block == 128) {
        reference = out;
      } else {
        worst = std::max(worst, difference(out, reference));
      }
    }
    ++phrases;
  }
  std::printf("block size: %d phrases with rests of 20 to 220 ms, in blocks of 1, 2048 and mixed sizes, differ from "
              "blocks of 128 by at most %g\n",
              phrases, worst);
  EXPECT(worst < 1.0e-6, "blocks of 1, 128, 2048 and mixed sizes give the same audio across a rest");

  // And a held note: the same at 1, 128 and 2048 frames, and the same in
  // both outputs.
  device.init(kRate);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo blocks = render(device, 1.0f, kRate, 128);
  EXPECT(blocks.left == blocks.right, "left and right are the same signal");
  for (int size : {1, 2048}) {
    device.init(kRate);
    device.note_on(1, static_cast<float>(kA1), 0.8f);
    Stereo sized = render(device, 1.0f, kRate, size);
    std::snprintf(label, sizeof label, "blocks of %d frames differ from blocks of 128 by %g", size, difference(sized, blocks));
    EXPECT(difference(sized, blocks) < 1.0e-6, label);
  }
}

// --- no clicks ----------------------------------------------------------------------------

static void test_clicks() {
  // A soft, dark held note for the events to stand out of.
  auto held = [](AcidBass& d) {
    steady(d);
    d.set_param(p::kCutoff, 300.0f);
    d.set_param(p::kResonance, 0.4f);
    d.set_param(p::kEnvMod, 0.5f);
    d.note_on(1, static_cast<float>(kA2), 0.7f);
  };
  auto fading = [](AcidBass& d) {
    steady(d);
    d.set_param(p::kCutoff, 300.0f);
    d.set_param(p::kEnvMod, 0.5f);
    d.set_param(p::kSustain, 0.6f);
    d.note_on(1, static_cast<float>(kA2), 0.7f);
  };
  auto silent = [](AcidBass& d) {
    steady(d);
    d.set_param(p::kCutoff, 300.0f);
    d.set_param(p::kEnvMod, 0.5f);
  };
  auto open = [](AcidBass& d) {
    steady(d);
    d.note_on(1, static_cast<float>(kA2), 0.7f);
  };
  auto open_square = [](AcidBass& d) {
    steady(d);
    d.set_param(p::kWave, 1.0f);
    d.note_on(1, static_cast<float>(kA2), 0.7f);
  };
  struct Event {
    const char* name;
    std::function<void(AcidBass&)> setup;
    std::function<void(AcidBass&)> event;
    float lead = 0.25f;  // seconds of the setup before the event
  };
  const Event events[] = {
      {"a strike from silence", silent, [](AcidBass& d) { d.note_on(1, static_cast<float>(kA2), 0.7f); }},
      {"an accented strike from silence", silent, [](AcidBass& d) { d.note_on(1, static_cast<float>(kA2), 1.0f); }},
      {"the key let go", held, [](AcidBass& d) { d.note_off(1); }},
      {"the held key struck again", held, [](AcidBass& d) { d.note_on(1, static_cast<float>(kA2), 0.7f); }},
      {"a fading key struck again", fading, [](AcidBass& d) { d.note_on(1, static_cast<float>(kA2), 0.7f); }},
      {"a fading key struck again, accented", fading, [](AcidBass& d) { d.note_on(1, static_cast<float>(kA2), 1.0f); }},
      {"another key played apart", held,
       [](AcidBass& d) {
         d.note_off(1);
         d.note_on(2, static_cast<float>(kC4), 0.7f);
       }},
      {"a key over the held one (a slide)", held, [](AcidBass& d) { d.note_on(2, static_cast<float>(kC4), 0.7f); }},
      {"a louder key over the held one", held, [](AcidBass& d) { d.note_on(2, static_cast<float>(kC3), 1.0f); }},
      // The same pitch, so that the level is all that changes: a slide's own
      // growing difference would hide a level that jumps.
      {"a louder key of the same pitch over the held one", held,
       [](AcidBass& d) { d.note_on(2, static_cast<float>(kA2), 1.0f); }},
      // A tie brings the loudness back: over a note 25 dB down and one 55 dB
      // down, to another pitch, to the same one, and hard.
      {"a key tied over a fading note", fading, [](AcidBass& d) { d.note_on(2, static_cast<float>(kC4), 0.7f); }},
      {"the same pitch tied over a fading note", fading, [](AcidBass& d) { d.note_on(2, static_cast<float>(kA2), 0.7f); }},
      {"a hard key tied over a fading note", fading, [](AcidBass& d) { d.note_on(2, static_cast<float>(kC3), 1.0f); }},
      {"a key tied over a note nearly gone", fading, [](AcidBass& d) { d.note_on(2, static_cast<float>(kC4), 0.7f); },
       0.55f},
      {"the same pitch tied over a note nearly gone", fading,
       [](AcidBass& d) { d.note_on(2, static_cast<float>(kA2), 0.7f); }, 0.55f},
      {"a tied key let go again (back to the key under it)", fading,
       [](AcidBass& d) {
         d.note_on(2, static_cast<float>(kC4), 0.7f);
         d.note_off(2);
       }},
      {"Cutoff thrown up", held, [](AcidBass& d) { d.set_param(p::kCutoff, 5000.0f); }},
      {"Cutoff thrown down", held, [](AcidBass& d) { d.set_param(p::kCutoff, 40.0f); }},
      {"Resonance thrown up", held, [](AcidBass& d) { d.set_param(p::kResonance, 1.0f); }},
      {"Resonance thrown down", held, [](AcidBass& d) { d.set_param(p::kResonance, 0.0f); }},
      {"Env Mod thrown up", held, [](AcidBass& d) { d.set_param(p::kEnvMod, 1.0f); }},
      {"Drive thrown up", held, [](AcidBass& d) { d.set_param(p::kDrive, 1.0f); }},
      {"Volume thrown down", held, [](AcidBass& d) { d.set_param(p::kVolume, -48.0f); }},
      {"Volume thrown up", held, [](AcidBass& d) { d.set_param(p::kVolume, 6.0f); }},
      {"Wave switched", held, [](AcidBass& d) { d.set_param(p::kWave, 1.0f); }},
      // The filter above would round off a switch made in one sample; open, it shows it.
      {"Wave switched under an open filter", open, [](AcidBass& d) { d.set_param(p::kWave, 1.0f); }},
      {"Wave switched back under an open filter", open_square, [](AcidBass& d) { d.set_param(p::kWave, 0.0f); }},
  };
  double worst = 0.0;
  const char* worst_name = "";
  for (const Event& event : events) {
    const double sudden = suddenness(event.setup, event.event, event.lead);
    if (sudden > worst) {
      worst = sudden;
      worst_name = event.name;
    }
    std::snprintf(label, sizeof label, "%s arrives gradually: %.3f of its change in its first 8 samples (under 0.2)",
                  event.name, sudden);
    EXPECT(sudden < 0.2, label);
    if (std::getenv("ACID_VERBOSE")) std::printf("  %s\n", label);
  }
  std::printf("clicks: of %d events and knob throws the most sudden is \"%s\", %.3f of its change in its first 8 samples\n",
              static_cast<int>(sizeof events / sizeof events[0]), worst_name, worst);

  // The coarser bound: under a dark filter the waveform is smooth, and
  // sixteen strikes and releases on a fading note, wherever in the cycle
  // they land, never step further than the held tone does by itself.
  steady(device);
  device.set_param(p::kCutoff, 200.0f);
  device.note_on(1, static_cast<float>(kA2), 0.7f);
  Stereo smooth = render(device, 0.5f, kRate);
  steady(device);
  device.set_param(p::kCutoff, 200.0f);
  device.set_param(p::kSustain, 0.25f);
  Stereo strikes;
  for (int n = 0; n < 16; ++n) {
    device.note_on(n, static_cast<float>(kA2), 0.7f);
    strikes = concat(strikes, render(device, 0.05f + 0.007f * static_cast<float>(n), kRate));
    if (n % 2 == 0) {
      device.note_off(n);
      strikes = concat(strikes, render(device, 0.004f * static_cast<float>(n), kRate));
    }
  }
  std::snprintf(label, sizeof label, "sixteen strikes and releases on a fading note: step %.4f against %.4f for the held tone",
                max_step(strikes.left), max_step(smooth.left, at(0.25)));
  EXPECT(max_step(strikes.left) < 1.5 * max_step(smooth.left, at(0.25)), label);

  // Cutoff swept back and forth under a held note, the knob most moved.
  steady(device);
  device.set_param(p::kCutoff, 2000.0f);
  device.set_param(p::kResonance, 0.5f);
  device.note_on(1, static_cast<float>(kA2), 0.7f);
  Stereo bright = render(device, 1.0f, kRate);
  Stereo swept;
  for (int i = 0; i < 100; ++i) {
    device.set_param(p::kCutoff, i % 2 == 0 ? 150.0f : 2000.0f);
    swept = concat(swept, render(device, 0.03f, kRate));
  }
  std::snprintf(label, sizeof label, "Cutoff jumping 150..2000 Hz a hundred times: step %.4f against %.4f steady",
                max_step(swept.left), max_step(bright.left, at(0.5)));
  EXPECT(max_step(swept.left) < 1.3 * max_step(bright.left, at(0.5)), label);
}

// --- levels, the bottom octave, other sample rates ---------------------------------------

static void test_levels() {
  // One note sits where the mixer expects it, harder keys are louder, ten
  // keys are still one voice under the soft clip's knee, and the clip is the
  // last thing in the chain.
  double lowest = 0.0, highest = -100.0;
  for (double hz : {kE0, kA1, kA2, kA3, kC4}) {
    device.init(kRate);
    device.note_on(1, static_cast<float>(hz), 0.7f);
    Stereo out = render(device, 1.0f, kRate);
    lowest = std::min(lowest, db(peak(out.left)));
    highest = std::max(highest, db(peak(out.left)));
  }
  std::printf("level: one default note at gain 0.7 peaks between %.1f and %.1f dBFS from E0 to C4\n", lowest, highest);
  EXPECT(lowest > -24.0 && highest < -10.0, "one default note at gain 0.7 peaks between -24 and -10 dBFS");
  double previous = 0.0;
  for (float gain : {0.1f, 0.4f, 0.7f, 1.0f}) {
    device.init(kRate);
    device.note_on(1, static_cast<float>(kA1), gain);
    Stereo out = render(device, 0.5f, kRate);
    const double level = rms(out.left, 0, at(0.2));
    EXPECT(level > 1.15 * previous, "a harder key is louder");
    previous = level;
  }
  device.init(kRate);
  for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  Stereo ten = render(device, 3.0f, kRate);
  device.init(kRate);
  device.note_on(9, 110.0f * std::pow(2.0f, 27 / 12.0f), 0.8f);
  Stereo one = render(device, 3.0f, kRate);
  std::snprintf(label, sizeof label, "ten held keys peak at %.3f, the last of them alone at %.3f (knee at 0.5)",
                peak(ten.left), peak(one.left));
  EXPECT(peak(ten.left) < 0.5 && ten.left == one.left, label);
  // The loudest a default-volume note gets: a full accent with resonance.
  device.init(kRate);
  device.set_param(p::kAccent, 1.0f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo accent = render(device, 1.0f, kRate);
  std::printf("level: a fully accented default note peaks at %.1f dBFS\n", db(peak(accent.left)));
  EXPECT(peak(accent.left) < 0.5, "a fully accented default note stays under the clip knee");
  // Everything up: the soft clip holds the output inside full scale.
  steady(device);
  device.set_param(p::kResonance, 1.0f);
  device.set_param(p::kCutoff, 500.0f);
  device.set_param(p::kEnvMod, 1.0f);
  device.set_param(p::kAccent, 1.0f);
  device.set_param(p::kDrive, 1.0f);
  device.set_param(p::kVolume, 6.0f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo most = render(device, 2.0f, kRate);
  std::snprintf(label, sizeof label, "everything up at +6 dB: the output peaks at %.4f (the clip lands on 1)", peak(most.left));
  EXPECT(peak(most.left) > 0.9 && peak(most.left) <= 1.0, label);

  // No DC, whatever the wave, the resonance and Drive make of it.
  double worst = 0.0;
  for (float wave : {0.0f, 1.0f}) {
    for (float resonance : {0.0f, 0.9f}) {
      for (float drive : {0.0f, 1.0f}) {
        steady(device);
        device.set_param(p::kWave, wave);
        device.set_param(p::kCutoff, 400.0f);
        device.set_param(p::kResonance, resonance);
        device.set_param(p::kDrive, drive);
        device.set_param(p::kVolume, -9.0f);  // under the soft clip, which would make DC of a lopsided wave
        device.note_on(1, static_cast<float>(kA1), 0.8f);
        Stereo out = render(device, 4.0f, kRate);
        const double offset = std::fabs(dc_offset(out.left, at(1.0), at(4.0))) / rms(out.left, at(1.0));
        worst = std::max(worst, offset);
        std::snprintf(label, sizeof label, "wave %.0f, Resonance %.1f, Drive %.0f: DC is %.5f of the signal", wave, resonance,
                      drive, offset);
        EXPECT(offset < 0.002, label);
      }
    }
  }
  std::printf("level: DC is at most %.5f of the signal over waves, resonance and Drive\n", worst);

  // The bottom octave is all there: the fundamentals of E0 (20.6 Hz) and of
  // C0 are within a dB of A2's. Only the 2 Hz DC blocker is under them.
  steady(device);
  device.note_on(1, static_cast<float>(kA2), 0.7f);
  Stereo middle = render(device, 4.0f, kRate);
  const double reference = tone_level(middle.left, kA2, kRate, at(1.0));
  for (double hz : {kE0, kC0}) {
    steady(device);
    device.note_on(1, static_cast<float>(hz), 0.7f);
    Stereo low = render(device, 4.0f, kRate);
    const double relative = db(tone_level(low.left, hz, kRate, at(1.0)) / reference);
    std::snprintf(label, sizeof label, "the fundamental of %.1f Hz is %.2f dB from A2's", hz, relative);
    EXPECT(std::fabs(relative) < 1.0, label);
    const double early = rms(low.left, at(1.0), at(2.0)), late = rms(low.left, at(3.0), at(4.0));
    EXPECT(std::fabs(db(late / early)) < 0.3, "and its level holds");
  }

  // Other sample rates: the same times and the same filter.
  double lift_at_48[2] = {0.0, 0.0};
  double second_accent_at_48 = 0.0, closed_at_48 = 0.0;
  for (float rate : {48000.0f, 44100.0f, 96000.0f}) {
    // The accent store charges and drains in seconds, not in samples: how
    // much brighter a second accent is 0.15 s after the first.
    double bright[2];
    accent_patch(device, 1.0f, 0.3f, rate);
    for (int n = 0; n < 2; ++n) {
      device.note_on(n, static_cast<float>(kA1), 1.0f);
      Stereo note = render(device, 0.08f, rate);
      device.note_off(n);
      render(device, 0.07f, rate);
      double weighted = 0.0, total = 0.0;
      for (int h = 1; h * kA1 < 12000.0; ++h) {
        const double level = tone_level(note.left, h * kA1, rate, at(0.02, rate), at(0.08, rate));
        weighted += h * kA1 * level;
        total += level;
      }
      bright[n] = weighted / total;
    }
    const double second_accent = std::log2(bright[1] / bright[0]);
    // The filter's Decay is seconds too: a 0.3 s Decay over three octaves,
    // read as where the harmonics 4 to 12 of A1 stand against the
    // fundamental 0.3 s after the strike (a Decay a tenth too long leaves
    // them half a dB higher; they have come down 10 dB since the strike).
    steady(device, rate);
    device.set_param(p::kCutoff, 150.0f);
    device.set_param(p::kEnvMod, 0.6f);
    device.set_param(p::kDecay, 0.3f);
    device.note_on(1, static_cast<float>(kA1), 0.7f);
    Stereo closes = render(device, 0.5f, rate);
    auto upper = [&](double from, double to) {
      double sum = 0.0;
      for (int h = 4; h <= 12; ++h) {
        const double level = tone_level(closes.left, h * kA1, rate, at(from, rate), at(to, rate));
        sum += level * level;
      }
      return db(std::sqrt(sum) / tone_level(closes.left, kA1, rate, at(from, rate), at(to, rate)));
    };
    const double closed = upper(0.26, 0.34), closing = upper(0.03, 0.07) - closed;
    steady(device, rate);
    device.set_param(p::kCutoff, 440.0f);
    device.set_param(p::kResonance, 0.75f);
    device.note_on(1, static_cast<float>(kA0), 0.7f);
    Stereo out = render(device, 2.0f, rate);
    auto lift = [&](int n) {
      return db(tone_level(out.left, n * kA0, rate, at(1.0, rate)) * n / tone_level(out.left, kA0, rate, at(1.0, rate)));
    };
    if (rate == kRate) {
      lift_at_48[0] = lift(16);
      lift_at_48[1] = lift(64);
      second_accent_at_48 = second_accent;
      closed_at_48 = closed;
      continue;
    }
    std::snprintf(label, sizeof label,
                  "at %.0f Hz a second accent 0.15 s after the first is %.3f octaves brighter (%.3f at 48 kHz, within 0.04)",
                  rate, second_accent, second_accent_at_48);
    EXPECT(std::fabs(second_accent - second_accent_at_48) < 0.04 && second_accent > 0.3, label);
    if (std::getenv("ACID_VERBOSE")) std::printf("  %s\n", label);
    std::snprintf(label, sizeof label,
                  "at %.0f Hz, 0.3 s into a 0.3 s Decay harmonics 4 to 12 stand at %.2f dB (%.2f at 48 kHz, within 0.4), "
                  "%.1f dB under where they started",
                  rate, closed, closed_at_48, closing);
    EXPECT(std::fabs(closed - closed_at_48) < 0.4 && closing > 8.0, label);
    if (std::getenv("ACID_VERBOSE")) std::printf("  %s\n", label);

    // The release: 40 dB down 16 ms after the key, exact silence by 60 ms.
    steady(device, rate);
    device.note_on(1, static_cast<float>(kC5), 0.7f);
    Stereo on = render(device, 0.1f, rate);
    device.note_off(1);
    Stereo off = render(device, 0.2f, rate);
    const double at_16 = db(rms(off.left, at(0.014, rate), at(0.018, rate)) / rms(on.left, at(0.09, rate), at(0.1, rate)));
    std::snprintf(label, sizeof label, "at %.0f Hz the release is %.1f dB down after 16 ms (34 to 46) and silence by 60 ms", rate,
                  at_16);
    EXPECT(at_16 < -34.0 && at_16 > -46.0 && peak(off.left, at(0.06, rate)) == 0.0, label);
    if (std::getenv("ACID_VERBOSE")) std::printf("  %s\n", label);

    // A tie's rise: 8 ms. The same pitch tied over a note 30 dB down against
    // the note left alone, as in the keys group.
    Stereo tie[2];
    for (int which = 0; which < 2; ++which) {
      steady(device, rate);
      device.set_param(p::kSustain, 1.0f);
      device.set_param(p::kVolume, -12.0f);
      device.note_on(1, static_cast<float>(kC3), 0.7f);
      render(device, 0.5f, rate);
      if (which == 0) device.note_on(2, static_cast<float>(kC3), 0.7f);
      tie[which] = render(device, 0.05f, rate);
    }
    auto risen = [&](double seconds) {  // of full, in the quarter of a millisecond from `seconds` after the tie
      const size_t from = at(seconds, rate), to = at(seconds + 0.00025, rate);
      return rms(tie[0].left, from, to) / rms(tie[1].left, from, to) * std::pow(10.0, -3.0 * (0.498 + seconds + 0.000125));
    };
    std::snprintf(label, sizeof label, "at %.0f Hz a tie has risen to %.2f of full after 3 ms (0.58) and %.2f after 10 ms (0.98)",
                  rate, risen(0.003), risen(0.010));
    EXPECT(risen(0.003) > 0.5 && risen(0.003) < 0.66 && risen(0.010) > 0.94 && risen(0.010) < 1.02, label);
    if (std::getenv("ACID_VERBOSE")) std::printf("  %s\n", label);
    std::snprintf(label, sizeof label,
                  "at %.0f Hz: Resonance 0.75 lifts the harmonic on Cutoff %.2f dB over the fundamental and two octaves "
                  "up the filter is %.2f dB down (%.2f and %.2f at 48 kHz)",
                  rate, lift(16), -lift(64), lift_at_48[0], -lift_at_48[1]);
    EXPECT(std::fabs(lift(16) - lift_at_48[0]) < 0.5 && lift(16) > lift(15) && lift(16) > lift(17) &&
               std::fabs(lift(64) - lift_at_48[1]) < 0.5,
           label);

    steady(device, rate);
    device.set_param(p::kSustain, 1.0f);
    device.note_on(1, static_cast<float>(kA2), 0.7f);
    Stereo fall = render(device, 1.3f, rate);
    const double measured = rt60(fall.left, rate, 0.01, 0.05, -80.0);
    std::snprintf(label, sizeof label, "at %.0f Hz a 1 s Sustain is 60 dB down after %.3f s", rate, measured);
    EXPECT(std::fabs(measured - 1.0) < 0.1, label);

    steady(device, rate);
    device.set_param(p::kSlide, 0.2f);
    device.note_on(1, static_cast<float>(kC3), 0.7f);
    render(device, 0.3f, rate);
    device.note_on(2, static_cast<float>(kC4), 0.7f);
    Stereo slide = render(device, 0.3f, rate);
    const double left = -cents(peak_frequency(slide.left, rate, 120.0, 280.0, at(0.085, rate), at(0.115, rate)), kC4);
    std::snprintf(label, sizeof label, "at %.0f Hz an octave slide of 0.2 s has %.0f cents to go at half time (120)", rate, left);
    EXPECT(std::fabs(left - 120.0) < 40.0, label);
  }
}

// --- the presets --------------------------------------------------------------------------

// Read one preset's values out of device.json (the defaults for what it does
// not list). The manifest is plain enough for this: `"Name": {` and then
// `"key": number` pairs up to the closing brace.
static bool manifest_preset(const std::string& text, const char* name, float* values) {
  const size_t presets = text.find("\"presets\"");
  if (presets == std::string::npos) return false;
  const std::string quoted = std::string("\"") + name + "\"";
  const size_t found = text.find(quoted, presets);
  if (found == std::string::npos) return false;
  const size_t open = text.find('{', found), close = text.find('}', found);
  if (open == std::string::npos || close == std::string::npos) return false;
  const std::string body = text.substr(open, close - open);
  for (int id = 0; id < p::kNumParams; ++id) {
    values[id] = p::kParamDefault[id];
    const std::string key = std::string("\"") + kParamKeys[id] + "\"";
    const size_t where = body.find(key);
    if (where != std::string::npos) values[id] = std::strtof(body.c_str() + body.find(':', where) + 1, nullptr);
  }
  return true;
}

// What a preset is asked to play: a plain note, a key over it, a rest, an
// accent, a rest.
static Stereo phrase(AcidBass& d) {
  d.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo out = render(d, 0.6f, kRate);
  d.note_on(2, 82.4069f, 0.7f);
  out = concat(out, render(d, 0.5f, kRate));
  d.note_off(2);
  d.note_off(1);
  out = concat(out, render(d, 0.2f, kRate));
  d.note_on(3, static_cast<float>(kA1), 1.0f);
  out = concat(out, render(d, 0.5f, kRate));
  d.note_off(3);
  return concat(out, render(d, 0.2f, kRate));
}

// Eight seconds of a bass line between A1 and A2 at gains of 0.6 to 1: keys
// played apart, three of them tied into the next (slides), and accents.
static Stereo bass_line(AcidBass& d) {
  struct Step {
    float hz, gain;
    bool tied;
  };
  static const Step steps[16] = {
      {55.0f, 0.6f, false},    {55.0f, 0.8f, false},    {82.4069f, 0.7f, true},   {110.0f, 1.0f, false},
      {97.9989f, 0.6f, false}, {82.4069f, 0.9f, false}, {65.4064f, 0.7f, false},  {55.0f, 1.0f, true},
      {73.4162f, 0.8f, false}, {82.4069f, 0.6f, false}, {110.0f, 0.9f, false},    {97.9989f, 1.0f, false},
      {82.4069f, 0.7f, true},  {65.4064f, 0.6f, false}, {61.7354f, 0.8f, false},  {55.0f, 1.0f, false},
  };
  Stereo out;
  bool carried = false;
  for (int n = 0; n < 16; ++n) {
    d.note_on(n, steps[n].hz, steps[n].gain);
    if (carried) {
      // The key before this one is let go a little after this one is down.
      out = concat(out, render(d, 0.15f, kRate));
      d.note_off(n - 1);
      out = concat(out, render(d, 0.25f, kRate));
    } else {
      out = concat(out, render(d, 0.4f, kRate));
    }
    carried = steps[n].tied;
    if (!carried) d.note_off(n);
    out = concat(out, render(d, 0.1f, kRate));
  }
  return out;
}

// What a render sounds like, as numbers: the level in nine octave bands
// (20 Hz to 15 kHz) in each 43 ms of it, in dB against the whole render's
// level and no lower than 60 dB under it. Two renders are compared by the
// mean difference over all bands and moments, so neither a different volume
// nor a waveform turned over counts, and a different tone, sweep or length
// does.
static const int kBands = 9;
static std::vector<float> sound_picture(const std::vector<float>& x) {
  static livemix::kit::Fft<2048> fft;
  static bool ready = false;
  if (!ready) {
    fft.init();
    ready = true;
  }
  const int n = 2048;
  const double whole = rms(x);
  std::vector<float> picture;
  float re[2048], im[2048];
  for (size_t from = 0; from + n <= x.size(); from += n) {
    for (int i = 0; i < n; ++i) {
      re[i] = static_cast<float>((0.5 - 0.5 * std::cos(2.0 * kPi * i / n)) * x[from + i]);
      im[i] = 0.0f;
    }
    fft.forward(re, im);
    double band[kBands] = {};
    for (int i = 1; i < n / 2; ++i) {
      const double f = i * kRate / n;
      const int which = static_cast<int>(std::floor(std::log2(f / 20.0) / 1.0666667));  // 20 Hz .. 15.5 kHz in nine
      if (which < 0 || which >= kBands) continue;
      band[which] += static_cast<double>(re[i]) * re[i] + static_cast<double>(im[i]) * im[i];
    }
    for (int b = 0; b < kBands; ++b) {
      // A Hann window passes 3/8 of the power; the spectrum is two-sided.
      const double level = std::sqrt(2.0 * band[b] / (0.375 * n * n));
      picture.push_back(static_cast<float>(std::max(-60.0, db(level / whole))));
    }
  }
  return picture;
}

static double pictures_apart(const std::vector<float>& a, const std::vector<float>& b) {
  double sum = 0.0;
  for (size_t i = 0; i < a.size(); ++i) sum += std::fabs(a[i] - b[i]);
  return sum / static_cast<double>(a.size());
}

static void test_presets() {
  EXPECT(kNumPresets == 16, "sixteen presets");
  // The table above is the manifest's: checked when the harness runs where
  // it can see the file (the repository root, as scripts/dev-device.sh does).
  std::string manifest;
  if (std::FILE* file = std::fopen("cpp/devices/acid-bass/device.json", "rb")) {
    char buffer[4096];
    size_t got;
    while ((got = std::fread(buffer, 1, sizeof buffer, file)) > 0) manifest.append(buffer, got);
    std::fclose(file);
  }
  if (manifest.empty()) {
    std::printf("presets: device.json not found from here; the table in this file was not checked against it\n");
  } else {
    int checked = 0;
    for (const Preset& preset : kPresets) {
      float values[p::kNumParams];
      const bool found = manifest_preset(manifest, preset.name, values);
      std::snprintf(label, sizeof label, "preset \"%s\" is in device.json with the values tested here", preset.name);
      bool same = found;
      for (int id = 0; found && id < p::kNumParams; ++id) same = same && values[id] == preset.values[id];
      EXPECT(same, label);
      checked += same ? 1 : 0;
    }
    size_t count = 0;
    const size_t start = manifest.find("\"presets\""), end = manifest.find("\"origin\"");
    for (size_t at_brace = manifest.find('{', start + 1); at_brace < end; at_brace = manifest.find('{', at_brace + 1)) ++count;
    EXPECT(count == static_cast<size_t>(kNumPresets) + 1, "device.json has the same number of presets as this table");
    std::printf("presets: %d of %d match device.json\n", checked, kNumPresets);
  }
  for (int id = 0; id < p::kNumParams; ++id) {
    EXPECT(kPresets[0].values[id] == p::kParamDefault[id], "the first preset is the default patch");
  }

  std::vector<Stereo> renders;
  int quiet_kind = 0;
  for (const Preset& preset : kPresets) {
    const size_t length = std::strlen(preset.name);
    std::snprintf(label, sizeof label,
                  "preset name \"%s\": at most 20 characters, no space at either end, not ending in a digit, and no "
                  "other preset has it in any case",
                  preset.name);
    int same_name = 0;
    for (const Preset& another : kPresets) {
      bool same = std::strlen(another.name) == length;
      for (size_t c = 0; same && c < length; ++c) {
        same = std::tolower(static_cast<unsigned char>(another.name[c])) ==
               std::tolower(static_cast<unsigned char>(preset.name[c]));
      }
      same_name += same ? 1 : 0;
    }
    EXPECT(length > 0 && length <= 20 && preset.name[0] != ' ' && preset.name[length - 1] != ' ' &&
               !(preset.name[length - 1] >= '0' && preset.name[length - 1] <= '9') && same_name == 1,
           label);

    load(device, preset);
    Stereo out = phrase(device);
    EXPECT(finite(out.left) && out.left == out.right, "a preset's phrase is finite and the same in both outputs");
    // The plain note, the accent, how bright the note starts and ends, and
    // how much of it is left after half a second.
    const double plain = db(peak(out.left, 0, at(0.6)));
    const double accent = db(peak(out.left, at(1.3), at(1.8)));
    const double bright = centroid(out.left, kA1, at(0.01), at(0.09));
    const double dark = centroid(out.left, kA1, at(0.4), at(0.6));
    const double left = db(rms(out.left, at(0.5), at(0.6)) / rms(out.left, at(0.02), at(0.12)));
    std::printf("  %-20s plain %5.1f dBFS, accent %5.1f dBFS, brightness %4.0f -> %4.0f Hz, %5.1f dB left at 0.55 s\n",
                preset.name, plain, accent, bright, dark, left);
    std::snprintf(label, sizeof label, "preset \"%s\": a note at gain 0.7 peaks at %.1f dBFS (-24..-9)", preset.name, plain);
    EXPECT(plain > -24.0 && plain < -9.0, label);
    std::snprintf(label, sizeof label, "preset \"%s\": an accent peaks at %.1f dBFS (louder than the plain note, under -4.5)",
                  preset.name, accent);
    EXPECT(accent > plain + 0.5 && accent < -4.5, label);
    // Soft, long, dark or slow: a note that is still there after half a
    // second and has little above 250 Hz by then, or a filter that takes two
    // seconds or more to close, or a slide of 0.4 s or more.
    if ((left > -12.0 && dark < 250.0) || preset.values[p::kDecay] >= 2.0f || preset.values[p::kSlide] >= 0.4f) ++quiet_kind;
    renders.push_back(out);
  }
  std::snprintf(label, sizeof label, "%d of the presets are soft, long, dark or slow (five or more)", quiet_kind);
  EXPECT(quiet_kind >= 5, label);
  std::printf("presets: %s\n", label);

  // Stepping through the presets does not jump in level: the same key at the
  // same gain, held a second, and the loudest moment of each preset against
  // the middle one's. Read two ways (the largest sample, and the loudest
  // 50 ms) and on three keys, since nothing here follows the keyboard and a
  // dark patch gives less on a high key.
  const double keys[3] = {41.2034, kA1, kA2};
  const char* const key_names[3] = {"E1", "A1", "A2"};
  for (int k = 0; k < 3; ++k) {
    double peaks[kNumPresets], loudest[kNumPresets];
    for (int i = 0; i < kNumPresets; ++i) {
      load(device, kPresets[i]);
      device.note_on(1, static_cast<float>(keys[k]), 0.7f);
      Stereo out = render(device, 1.0f, kRate);
      device.note_off(1);
      out = concat(out, render(device, 0.3f, kRate));
      peaks[i] = db(peak(out.left));
      double most = 0.0;
      for (size_t from = 0; from + at(0.05) <= out.size(); from += at(0.01)) {
        most = std::max(most, static_cast<double>(rms(out.left, from, from + at(0.05))));
      }
      loudest[i] = db(most);
      if (std::getenv("ACID_VERBOSE")) {
        std::printf("  %s %-20s loudest sample %5.1f dBFS, loudest 50 ms %5.1f dBFS\n", key_names[k], kPresets[i].name,
                    peaks[i], loudest[i]);
      }
    }
    const auto spread = [](const double* values, double* low, double* high, int* low_at, int* high_at) {
      std::vector<double> sorted(values, values + kNumPresets);
      std::sort(sorted.begin(), sorted.end());
      const double middle = 0.5 * (sorted[kNumPresets / 2 - 1] + sorted[kNumPresets / 2]);
      *low = 0.0;
      *high = 0.0;
      for (int i = 0; i < kNumPresets; ++i) {
        if (values[i] - middle < *low) *low = values[i] - middle, *low_at = i;
        if (values[i] - middle > *high) *high = values[i] - middle, *high_at = i;
      }
      return middle;
    };
    double low = 0.0, high = 0.0, low_rms = 0.0, high_rms = 0.0;
    int low_at = 0, high_at = 0, low_rms_at = 0, high_rms_at = 0;
    const double middle = spread(peaks, &low, &high, &low_at, &high_at);
    const double middle_rms = spread(loudest, &low_rms, &high_rms, &low_rms_at, &high_rms_at);
    // On A1, where the lines are played, well inside the 6 dB asked for; on
    // the keys either side, inside it.
    const double allowed = k == 1 ? 4.0 : 6.0;
    std::snprintf(label, sizeof label,
                  "%s at gain 0.7, held a second: the presets' loudest sample is %+.1f (\"%s\") to %+.1f dB (\"%s\") from "
                  "the middle one's (%.1f dBFS), their loudest 50 ms %+.1f (\"%s\") to %+.1f dB (\"%s\") (%.1f dBFS); within %.0f",
                  key_names[k], low, kPresets[low_at].name, high, kPresets[high_at].name, middle, low_rms,
                  kPresets[low_rms_at].name, high_rms, kPresets[high_rms_at].name, middle_rms, allowed);
    EXPECT(low > -allowed && high < allowed && low_rms > -allowed && high_rms < allowed, label);
    std::printf("presets: %s\n", label);
  }

  // Each preset alone on the bass line: its loudest 400 ms against the middle
  // preset's, its peak, its DC, and how far its sound is from every other's.
  {
    double loudest[kNumPresets];
    std::vector<std::vector<float>> pictures;
    for (int i = 0; i < kNumPresets; ++i) {
      load(device, kPresets[i]);
      const Stereo out = bass_line(device);
      double most = 0.0;
      for (size_t from = 0; from + at(0.4) <= out.size(); from += at(0.05)) {
        most = std::max(most, static_cast<double>(rms(out.left, from, from + at(0.4))));
      }
      loudest[i] = db(most);
      const double top = db(peak(out.left));
      double mean = 0.0;
      for (float v : out.left) mean += v;
      mean = std::fabs(mean / static_cast<double>(out.size()));
      std::snprintf(label, sizeof label,
                    "preset \"%s\" on the bass line: loudest 400 ms %.1f dBFS (over -50), peak %.1f dBFS (under -4), DC %.5f "
                    "(under 0.002)",
                    kPresets[i].name, loudest[i], top, mean);
      EXPECT(loudest[i] > -50.0 && top < -4.0 && mean < 0.002, label);
      if (std::getenv("ACID_VERBOSE")) std::printf("  %s\n", label);
      pictures.push_back(sound_picture(out.left));
      if (std::getenv("ACID_VERBOSE")) {
        // The picture averaged over time: the nine bands, low to high.
        std::printf("  bands %-20s", kPresets[i].name);
        for (int band = 0; band < kBands; ++band) {
          double sum = 0.0;
          for (size_t at_frame = band; at_frame < pictures.back().size(); at_frame += kBands) sum += pictures.back()[at_frame];
          std::printf(" %5.1f", sum * kBands / static_cast<double>(pictures.back().size()));
        }
        std::printf("\n");
      }
    }
    std::vector<double> sorted(loudest, loudest + kNumPresets);
    std::sort(sorted.begin(), sorted.end());
    const double middle = 0.5 * (sorted[kNumPresets / 2 - 1] + sorted[kNumPresets / 2]);
    int low_at = 0, high_at = 0;
    for (int i = 0; i < kNumPresets; ++i) {
      if (loudest[i] < loudest[low_at]) low_at = i;
      if (loudest[i] > loudest[high_at]) high_at = i;
    }
    std::snprintf(label, sizeof label,
                  "on the bass line the presets' loudest 400 ms is %+.1f (\"%s\") to %+.1f dB (\"%s\") from the middle "
                  "one's (%.1f dBFS); within 4",
                  loudest[low_at] - middle, kPresets[low_at].name, loudest[high_at] - middle, kPresets[high_at].name, middle);
    EXPECT(loudest[low_at] - middle > -4.0 && loudest[high_at] - middle < 4.0, label);
    std::printf("presets: %s\n", label);

    struct Pair {
      double apart;
      int a, b;
    };
    std::vector<Pair> pairs;
    for (int a = 0; a < kNumPresets; ++a) {
      for (int b = a + 1; b < kNumPresets; ++b) pairs.push_back({pictures_apart(pictures[a], pictures[b]), a, b});
    }
    std::sort(pairs.begin(), pairs.end(), [](const Pair& x, const Pair& y) { return x.apart < y.apart; });
    for (int i = 0; i < 4; ++i) {
      std::printf("presets: %s pair in sound: \"%s\" and \"%s\", %.2f dB apart over bands and moments\n",
                  i == 0 ? "the closest" : "the next", kPresets[pairs[i].a].name, kPresets[pairs[i].b].name, pairs[i].apart);
    }
    std::snprintf(label, sizeof label, "no two presets sound alike on the bass line: the closest are %.2f dB apart (2.5 or more)",
                  pairs[0].apart);
    EXPECT(pairs[0].apart > 2.5, label);
  }

  // No two render alike: the difference between any two phrases, each
  // brought to the same loudness, is at least a third of the phrase itself.
  double closest = 1.0e9;
  int closest_a = 0, closest_b = 0;
  for (int a = 0; a < kNumPresets; ++a) {
    for (int b = a + 1; b < kNumPresets; ++b) {
      const double level_a = rms(renders[a].left), level_b = rms(renders[b].left);
      double sum = 0.0;
      for (size_t i = 0; i < renders[a].size(); ++i) {
        const double d = renders[a].left[i] / level_a - renders[b].left[i] / level_b;
        sum += d * d;
      }
      const double apart = std::sqrt(sum / static_cast<double>(renders[a].size()));
      if (apart < closest) {
        closest = apart;
        closest_a = a;
        closest_b = b;
      }
    }
  }
  std::snprintf(label, sizeof label, "the two presets most alike (\"%s\" and \"%s\") differ by %.2f of the phrase's level (0.33)",
                kPresets[closest_a].name, kPresets[closest_b].name, closest);
  EXPECT(closest > 0.33, label);
  std::printf("presets: %s\n", label);
}

int main(int argc, char** argv) {
  struct Group {
    const char* name;
    void (*run)();
  };
  const Group groups[] = {
      {"pitch", test_pitch},
      {"slope", test_filter_slope},
      {"resonance", test_resonance},
      {"filter-envelope", test_filter_envelope},
      {"accent", test_accent},
      {"waves", test_waves},
      {"keys", test_keys},
      {"loudness", test_loudness},
      {"drive", test_drive},
      {"from-rest", test_from_rest},
      {"clicks", test_clicks},
      {"levels", test_levels},
      {"presets", test_presets},
  };
  // `acid_bass_test <group>` runs one group alone; with no argument, everything.
  const char* only = argc > 1 ? argv[1] : nullptr;
  if (!only || std::strcmp(only, "conformance") == 0) {
    Conformance spec;
    spec.name = "acid-bass";
    spec.num_params = p::kNumParams;
    spec.mins = p::kParamMin;
    spec.maxs = p::kParamMax;
    spec.defaults = p::kParamDefault;
    spec.tail_seconds = 3.0f;
    spec.max_peak = 1.01f;
    check_instrument(device, spec, kRate);
  }
  for (const Group& group : groups) {
    if (!only || std::strcmp(only, group.name) == 0) group.run();
  }
  // Cost of the one voice, held with everything in play (the default patch
  // fades and goes to sleep, which would time nothing).
  if (!only || std::strcmp(only, "cost") == 0) {
    device.init(kRate);
    device.set_param(p::kSustain, 20.0f);
    device.set_param(p::kDecay, 10.0f);
    device.set_param(p::kDrive, 0.5f);
    device.note_on(1, static_cast<float>(kA1), 1.0f);
    report_cost("acid-bass (held note)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  }
  return finish("acid-bass");
}
