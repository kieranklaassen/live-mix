// Native harness for Pitch Shifter (cpp/devices/pitch-shifter). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest asserts what makes it a pitch
// shifter: the output pitch in each mode, how clean each mode is, chords,
// climbing repeats, latency, and that moving Pitch or Mode does not click.
// The Chords mode has its own checks (check_chords and the two after it):
// every note of a close chord on its shifted pitch with nothing else within
// 40 dB, printed beside the same measurement for Smooth.
//
// Set PITCH_SHIFTER_VERBOSE=1 to print every measured number.

#include <cstdlib>

#include "../devices/pitch-shifter/pitch_shifter.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::PitchShifter;
namespace p = livemix::pitch_shifter;

static PitchShifter device;

static const float kRate = 48000.0f;
enum { kSmooth = 0, kGrain = 1, kVintage = 2, kChords = 3 };

static bool verbose() {
  static const bool on = std::getenv("PITCH_SHIFTER_VERBOSE") != nullptr;
  return on;
}
#define NOTE(...)                        \
  do {                                   \
    if (verbose()) std::printf(__VA_ARGS__); \
  } while (0)

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// Only the shifted voice A, unfiltered, in the middle.
static void wet_only(PitchShifter& d, int mode, float pitch, float size = 60.0f) {
  d.init(kRate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kMode, static_cast<float>(mode));
  d.set_param(p::kPitchA, pitch);
  d.set_param(p::kSize, size);
  d.set_param(p::kTone, 18000.0f);
  d.set_param(p::kSpread, 0.0f);
}

// The frequency of a steady tone known to lie within a few hertz of `hz`:
// how fast its phase against `hz` turns between the two halves of
// [from, to). Returns 0 when there is no such tone to speak of.
static double frequency_near(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  const size_t middle = (from + to) / 2;
  if (tone_level(x, hz, rate, from, to) < 0.05) return 0.0;
  double turn = tone_phase(x, hz, rate, middle, to) - tone_phase(x, hz, rate, from, middle);
  while (turn > kPi) turn -= 2.0 * kPi;
  while (turn < -kPi) turn += 2.0 * kPi;
  return hz + turn / (2.0 * kPi) * rate / static_cast<double>(middle - from);
}

// Power-weighted mean frequency within `span` Hz of `centre`: where the
// pitch sits when a mode spreads a tone into a cluster of lines.
static double centroid(const std::vector<float>& x, double centre, double span, size_t from, size_t to,
                       int steps) {
  double power = 0.0, weighted = 0.0;
  for (int i = -steps; i <= steps; ++i) {
    const double hz = centre + span * i / steps;
    const double level = tone_level(x, hz, kRate, from, to);
    power += level * level;
    weighted += level * level * hz;
  }
  return weighted / power;
}

// Everything that is not one steady sinusoid near `hz`, in dB against that
// sinusoid: least-squares fit, at the best of a fine scan of frequencies.
static double spurious_db(const std::vector<float>& x, double hz, size_t from, size_t to) {
  double best = 1.0e9;
  for (int k = -10; k <= 10; ++k) {
    const double f = hz * (1.0 + k * 2.0e-6);
    double scc = 0, sss = 0, scs = 0, sxc = 0, sxs = 0, sxx = 0;
    for (size_t i = from; i < to; ++i) {
      const double phase = 2.0 * kPi * f * static_cast<double>(i) / kRate;
      const double c = std::cos(phase), s = std::sin(phase);
      scc += c * c;
      sss += s * s;
      scs += c * s;
      sxc += x[i] * c;
      sxs += x[i] * s;
      sxx += static_cast<double>(x[i]) * x[i];
    }
    const double det = scc * sss - scs * scs;
    const double a = (sxc * sss - sxs * scs) / det, b = (sxs * scc - sxc * scs) / det;
    const double fit = a * sxc + b * sxs;
    best = std::min(best, 10.0 * std::log10(std::max(1.0e-20, sxx - fit) / std::max(1.0e-20, fit)));
  }
  return best;
}

// Peak-to-trough of the level over windows of `window` samples, in dB.
static double flutter_db(const std::vector<float>& x, size_t from, size_t to, size_t window) {
  double lo = 1.0e9, hi = 0.0;
  for (size_t i = from; i + window <= to; i += window / 2) {
    const double level = rms(x, i, i + window);
    lo = std::min(lo, level);
    hi = std::max(hi, level);
  }
  return db(hi / std::max(lo, 1.0e-12));
}

// Mean power within about `band` Hz of `hz` (heterodyne and two one-pole
// lowpasses: soft skirts, so only compare like with like), skipping the
// first 100 ms while the filters settle. `total` gets the whole power.
static double band_power(const std::vector<float>& x, double hz, double band, size_t from, size_t to,
                         double* total = nullptr) {
  const double a = std::exp(-2.0 * kPi * band / kRate);
  double re1 = 0, im1 = 0, re2 = 0, im2 = 0, inside = 0, whole = 0;
  size_t count = 0;
  for (size_t i = from; i < to; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
    const double re = x[i] * std::cos(phase), im = -x[i] * std::sin(phase);
    re1 = re + (re1 - re) * a;
    im1 = im + (im1 - im) * a;
    re2 = re1 + (re2 - re1) * a;
    im2 = im1 + (im2 - im1) * a;
    if (i >= from + 4800) {
      inside += 2.0 * (re2 * re2 + im2 * im2);
      whole += static_cast<double>(x[i]) * x[i];
      ++count;
    }
  }
  if (total) *total = whole / static_cast<double>(count);
  return inside / static_cast<double>(count);
}

// Share of the power further than about `band` Hz from `hz`.
static double share_outside(const std::vector<float>& x, double hz, double band, size_t from, size_t to) {
  double total = 0.0;
  const double inside = band_power(x, hz, band, from, to, &total);
  return std::max(0.0, 1.0 - inside / std::max(total, 1.0e-20));
}

// Time of the centre of the energy in [from, to), in samples.
static double energy_centre(const std::vector<float>& x, size_t from, size_t to) {
  double sum = 0.0, weighted = 0.0;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    const double e = static_cast<double>(x[i]) * x[i];
    sum += e;
    weighted += e * static_cast<double>(i);
  }
  return weighted / std::max(sum, 1.0e-30);
}

// A Hann-shaped burst of a sine, `length` samples from `at`, added to x.
static void add_burst(std::vector<float>& x, size_t at, size_t length, float hz, float gain) {
  for (size_t i = 0; i < length && at + i < x.size(); ++i) {
    const double window = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / length);
    x[at + i] += gain * static_cast<float>(window * std::sin(2.0 * kPi * hz * static_cast<double>(at + i) / kRate));
  }
}

// A line-spectrum meter for chords: 65536 samples from `from` under a
// Blackman-Harris window (lines 3 Hz wide at 48 kHz, skirts below -90 dB).
// For every frequency in `expected`, how far off the nearest line is and how
// loud; then the loudest thing more than 4 Hz from all of them, against the
// loudest expected line.
struct Lines {
  double worst_cents = 0.0;  // largest pitch error among the expected lines
  double weakest_db = 0.0;   // quietest expected line against the loudest
  double other_db = -300.0;  // loudest thing that is not an expected line
  double other_hz = 0.0;
};

static Lines measure_lines(const std::vector<float>& x, size_t from, double rate, const std::vector<double>& expected) {
  static const int kPoints = 65536;
  static livemix::kit::Fft<kPoints> fft;
  static std::vector<float> re(kPoints), im(kPoints);
  static bool ready = false;
  if (!ready) {
    fft.init();
    ready = true;
  }
  for (int i = 0; i < kPoints; ++i) {
    const double t = 2.0 * kPi * i / kPoints;
    const double w = 0.35875 - 0.48829 * std::cos(t) + 0.14128 * std::cos(2.0 * t) - 0.01168 * std::cos(3.0 * t);
    re[i] = static_cast<float>(x[from + i] * w);
    im[i] = 0.0f;
  }
  fft.forward(re.data(), im.data());
  std::vector<double> level(kPoints / 2);
  for (int k = 0; k < kPoints / 2; ++k) level[k] = 10.0 * std::log10(re[k] * re[k] + im[k] * im[k] + 1.0e-30);
  const double bin = rate / kPoints;
  const int guard = static_cast<int>(4.0 / bin + 0.5);
  std::vector<char> owned(level.size(), 0);
  double top = -300.0, weakest = 300.0;
  Lines out;
  for (double hz : expected) {
    const int centre = static_cast<int>(hz / bin + 0.5);
    int best = centre;
    for (int k = centre - 6; k <= centre + 6; ++k) {
      if (k > 0 && k < kPoints / 2 - 1 && level[k] > level[best]) best = k;
    }
    const double a = level[best - 1], b = level[best], c = level[best + 1];
    const double found = (best + 0.5 * (a - c) / (a - 2.0 * b + c)) * bin;
    const double error = cents(found, hz);
    if (std::fabs(error) > std::fabs(out.worst_cents)) out.worst_cents = error;
    top = std::max(top, b);
    weakest = std::min(weakest, b);
    for (int k = centre - guard; k <= centre + guard; ++k) {
      if (k >= 0 && k < kPoints / 2) owned[k] = 1;
    }
  }
  for (size_t k = 20; k < level.size(); ++k) {
    if (!owned[k] && level[k] - top > out.other_db) {
      out.other_db = level[k] - top;
      out.other_hz = k * bin;
    }
  }
  out.weakest_db = weakest - top;
  return out;
}

// Notes as steady tones with `harmonics` partials each, the h-th at 1/h.
static std::vector<float> held_notes(const std::vector<double>& notes, float seconds, double rate, int harmonics = 2) {
  std::vector<float> x(static_cast<size_t>(seconds * rate), 0.0f);
  for (size_t n = 0; n < notes.size(); ++n) {
    for (int h = 1; h <= harmonics; ++h) {
      for (size_t i = 0; i < x.size(); ++i) {
        x[i] += static_cast<float>(0.15 / h * std::sin(2.0 * kPi * notes[n] * h * i / rate + 0.7 * n + 1.3 * h));
      }
    }
  }
  return x;
}

static std::vector<double> shifted_lines(const std::vector<double>& notes, double ratio, int harmonics = 2) {
  std::vector<double> hz;
  for (double note : notes) {
    for (int h = 1; h <= harmonics; ++h) hz.push_back(h * note * ratio);
  }
  return hz;
}

static void check_pitch();
static void check_chords();
static void check_chords_fit();
static void check_chords_moves();
static void check_chords_switch();
static void check_character();
static void check_chord_and_voices();
static void check_feedback_and_delay();
static void check_moves();
static void check_bad_input();
static void check_wake();
static void check_spread_work();

int main() {
  Conformance spec;
  spec.name = "pitch-shifter";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  check_pitch();
  check_chords();
  check_chords_fit();
  check_chords_moves();
  check_chords_switch();
  check_character();
  check_chord_and_voices();
  check_feedback_and_delay();
  check_moves();
  check_bad_input();
  check_wake();
  check_spread_work();

  // The heaviest sensible setting: both voices as jittered grains, fed back.
  device.init(kRate);
  device.set_param(p::kMode, kGrain);
  device.set_param(p::kLevelB, 1.0f);
  device.set_param(p::kJitter, 0.5f);
  device.set_param(p::kFeedback, 0.5f);
  device.set_param(p::kDelay, 200.0f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("pitch-shifter (two grain voices)", 10.0f, kRate, [&] { run(device, input); });

  // And the Chords mode with both voices, fed back.
  device.init(kRate);
  device.set_param(p::kMode, kChords);
  device.set_param(p::kLevelB, 1.0f);
  device.set_param(p::kFeedback, 0.5f);
  device.set_param(p::kDelay, 200.0f);
  report_cost("pitch-shifter (two Chords voices)", 10.0f, kRate, [&] { run(device, input); });

  return finish("pitch-shifter");
}


// The output pitch. Smooth and a small detune land on the frequency itself.
// Grain with Jitter is a cluster centred on it. Vintage splices on a fixed
// grid, so a wide interval comes out as lines one splice rate apart around
// the pitch (its flutter): the cluster is centred within one such step.
static void check_pitch() {
  struct Case {
    float pitch, detune;
  };
  const Case cases[] = {{12.0f, 0.0f}, {-12.0f, 0.0f}, {7.0f, 0.0f}, {0.0f, 25.0f}};
  char label[160];
  const size_t from = 36000, to = 72000;

  for (const Case& c : cases) {
    const double ratio = std::pow(2.0, (c.pitch + c.detune / 100.0) / 12.0);
    double worst = 0.0;
    for (float hz : {220.0f, 440.0f, 1000.0f}) {
      wet_only(device, kSmooth, c.pitch);
      device.set_param(p::kDetune, c.detune);
      Stereo out = run(device, sine(hz, 1.5f, kRate, 0.5f));
      const double found = frequency_near(out.left, hz * ratio, kRate, from, to);
      worst = std::max(worst, found > 0.0 ? std::fabs(cents(found, hz * ratio)) : 1200.0);
    }
    NOTE("pitch: Smooth %+.0f st %+.0f ct: worst error %.2f cents\n", c.pitch, c.detune, worst);
    std::snprintf(label, sizeof label, "Smooth lands within 3 cents at %+.0f st %+.0f ct (worst %.2f)", c.pitch,
                  c.detune, worst);
    EXPECT(worst < 3.0, label);
  }

  // The same at the other sample rates: times are in seconds, not samples.
  for (float rate : {44100.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(p::kMode, kSmooth);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kPitchA, 7.0f);
    Stereo out = run(device, sine(440.0f, 1.5f, rate, 0.5f));
    const size_t a = static_cast<size_t>(0.75f * rate), b = static_cast<size_t>(1.5f * rate);
    const double want = 440.0 * std::pow(2.0, 7.0 / 12.0);
    const double found = frequency_near(out.left, want, rate, a, b);
    const double flutter = flutter_db(out.left, a, b, static_cast<size_t>(0.01f * rate));
    NOTE("pitch at %.0f Hz: %+.2f cents, flutter %.2f dB, level %.2f dB\n", rate, cents(found, want), flutter,
         db(rms(out.left, a, b) / (0.5 / std::sqrt(2.0))));
    std::snprintf(label, sizeof label, "Smooth lands within 3 cents at %.0f Hz (%.2f)", rate, cents(found, want));
    EXPECT(std::fabs(cents(found, want)) < 3.0 && flutter < 1.0, label);
  }

  for (const Case& c : cases) {
    const double ratio = std::pow(2.0, (c.pitch + c.detune / 100.0) / 12.0);
    double worst = 0.0;
    // High notes and a long look: the cluster is some 30 Hz wide and what
    // is measured is the mean of a few hundred grains.
    for (float hz : {3520.0f, 5274.0f}) {
      wet_only(device, kGrain, c.pitch);
      device.set_param(p::kDetune, c.detune);
      device.set_param(p::kJitter, 0.3f);
      Stereo out = run(device, sine(hz, 6.0f, kRate, 0.5f));
      const double found = centroid(out.left, hz * ratio, 40.0, 24000, 288000, 20);
      worst = std::max(worst, std::fabs(cents(found, hz * ratio)));
    }
    NOTE("pitch: Grain (Jitter 0.3) %+.0f st %+.0f ct: centre off by %.2f cents\n", c.pitch, c.detune, worst);
    std::snprintf(label, sizeof label, "Grain is centred within 3 cents at %+.0f st %+.0f ct (worst %.2f)",
                  c.pitch, c.detune, worst);
    EXPECT(worst < 3.0, label);
  }

  for (const Case& c : cases) {
    const double ratio = std::pow(2.0, (c.pitch + c.detune / 100.0) / 12.0);
    // Lines sit |1 - ratio| / window apart; the window is Size.
    const double spacing = std::fabs(1.0 - ratio) / 0.06;
    double worst = 0.0, allowed = 0.0;
    for (float hz : {880.0f, 2093.0f}) {
      wet_only(device, kVintage, c.pitch);
      device.set_param(p::kDetune, c.detune);
      Stereo out = run(device, sine(hz, 3.0f, kRate, 0.5f));
      const double found = c.detune > 0.0f
                               ? dominant_frequency(out.left, kRate, hz * ratio * 0.97, hz * ratio * 1.03, 48000, 96000)
                               : centroid(out.left, hz * ratio, 60.0, 48000, 72000, 30);
      const double error = std::fabs(cents(found, hz * ratio));
      const double limit = c.detune > 0.0f ? 3.0 : cents(hz * ratio + spacing, hz * ratio);
      if (error / limit > worst / std::max(allowed, 1.0e-9) || allowed == 0.0) {
        worst = error;
        allowed = limit;
      }
    }
    NOTE("pitch: Vintage %+.0f st %+.0f ct: off by %.2f cents (allowed %.2f)\n", c.pitch, c.detune, worst, allowed);
    std::snprintf(label, sizeof label, "Vintage is centred on %+.0f st %+.0f ct (off %.2f, allowed %.2f)", c.pitch,
                  c.detune, worst, allowed);
    EXPECT(worst < allowed, label);
  }
}

// How clean each mode is on one steady note. Smooth: no flutter, nothing but
// the tone. Vintage: flutter and sidebands, measurably. Grain: Jitter turns
// the tone into noise around the pitch, more with every step, and a short
// Size turns it into a comb at the grain rate.
static void check_character() {
  char label[160];
  const size_t from = 36000, to = 60000;

  double smooth_worst = -200.0, smooth_flutter = 0.0;
  struct Note {
    float hz, pitch;
  };
  for (const Note& n : {Note{440.0f, 12.0f}, Note{261.63f, 7.0f}, Note{880.0f, -12.0f}, Note{1318.5f, 12.0f}}) {
    wet_only(device, kSmooth, n.pitch);
    Stereo out = run(device, sine(n.hz, 1.5f, kRate, 0.5f));
    const double want = n.hz * std::pow(2.0, n.pitch / 12.0);
    smooth_worst = std::max(smooth_worst, spurious_db(out.left, want, from, to));
    smooth_flutter = std::max(smooth_flutter, flutter_db(out.left, from, to, 480));
  }
  NOTE("character: Smooth on a sine: spurious %.1f dB, flutter %.2f dB\n", smooth_worst, smooth_flutter);
  std::snprintf(label, sizeof label, "Smooth: everything but the tone is 40 dB down (%.1f dB)", smooth_worst);
  EXPECT(smooth_worst < -40.0, label);
  std::snprintf(label, sizeof label, "Smooth: level flutter under 1 dB (%.2f dB)", smooth_flutter);
  EXPECT(smooth_flutter < 1.0, label);

  // Vintage depends on where the note falls on its splice grid: some notes
  // come out steady but off pitch, others beat. Take the best and worst of
  // four neighbouring notes.
  double vintage_spurious = 200.0, vintage_flutter = 0.0;
  for (float hz : {440.0f, 446.0f, 452.0f, 458.0f}) {
    wet_only(device, kVintage, 12.0f);
    Stereo vintage = run(device, sine(hz, 1.5f, kRate, 0.5f));
    vintage_spurious = std::min(vintage_spurious, spurious_db(vintage.left, 2.0 * hz, from, to));
    vintage_flutter = std::max(vintage_flutter, flutter_db(vintage.left, from, to, 480));
  }
  NOTE("character: Vintage on a sine: spurious %.1f dB, flutter %.2f dB\n", vintage_spurious, vintage_flutter);
  EXPECT(vintage_spurious > smooth_worst + 20.0, "Vintage: sidebands at least 20 dB above Smooth's");
  EXPECT(vintage_flutter > 3.0, "Vintage flutters by more than 3 dB where Smooth stays under 1 dB");

  // Jitter: share of the power more than ~30 Hz from the shifted pitch.
  double previous = -1.0;
  bool rising = true;
  double shares[4];
  int index = 0;
  for (float jitter : {0.0f, 0.35f, 0.7f, 1.0f}) {
    wet_only(device, kGrain, 12.0f, 120.0f);
    device.set_param(p::kJitter, jitter);
    Stereo out = run(device, sine(1000.0f, 4.0f, kRate, 0.5f));
    const double share = share_outside(out.left, 2000.0, 30.0, 24000, 192000);
    shares[index++] = share;
    if (share <= previous) rising = false;
    previous = share;
  }
  NOTE("character: Grain noise share by Jitter 0 / 0.35 / 0.7 / 1: %.3f %.3f %.3f %.3f\n", shares[0], shares[1],
       shares[2], shares[3]);
  EXPECT(rising, "Grain: every step of Jitter moves more of the tone into noise around it");
  EXPECT(shares[3] > 2.0 * shares[0], "Grain: full Jitter at least doubles the noise share");

  // Size 10 ms without Jitter: grains 2.5 ms apart, a comb every 400 Hz.
  wet_only(device, kGrain, 12.0f, 10.0f);
  Stereo comb = run(device, sine(1100.0f, 1.5f, kRate, 0.5f));
  double on_comb = 0.0, off_comb = 0.0;
  for (int m = 1; m <= 6; ++m) {
    const double line = tone_level(comb.left, 1100.0 + 400.0 * m, kRate, from, to);
    const double gap = tone_level(comb.left, 1100.0 + 400.0 * m - 200.0, kRate, from, to);
    on_comb += line * line;
    off_comb += gap * gap;
  }
  NOTE("character: Grain at Size 10 ms: comb lines %.1f dB above the gaps\n", 10.0 * std::log10(on_comb / off_comb));
  EXPECT(on_comb > 1000.0 * off_comb, "Grain: a short Size is a comb at the grain rate");
}

// Chords, the second voice, Detune, Spread, Tone and Mix.
static void check_chord_and_voices() {
  char label[160];
  const size_t from = 36000, to = 84000;

  // A major triad up a fifth: three shifted notes, none of the played ones.
  {
    const float notes[3] = {220.0f, 277.18f, 329.63f};
    std::vector<float> chord(static_cast<size_t>(2.0f * kRate), 0.0f);
    for (float hz : notes) {
      const std::vector<float> one = sine(hz, 2.0f, kRate, 0.2f);
      for (size_t i = 0; i < chord.size(); ++i) chord[i] += one[i];
    }
    for (int mode : {kSmooth, kGrain}) {
      wet_only(device, mode, 7.0f);
      if (mode == kGrain) device.set_param(p::kJitter, 0.3f);
      Stereo out = run(device, chord);
      double weakest = 1.0e9, leak = 0.0;
      for (float hz : notes) {
        // A note is a cluster in Grain and wavers in a chord in Smooth:
        // take its power within 20 Hz, as an amplitude.
        const double power = band_power(out.left, hz * std::pow(2.0, 7.0 / 12.0), 20.0, from, to);
        weakest = std::min(weakest, std::sqrt(2.0 * power));
        // 220 Hz and 277 Hz are not notes of the shifted chord (329.6 Hz is: it is 220 up a fifth).
        if (hz < 300.0f) leak = std::max(leak, tone_level(out.left, hz, kRate, from, to));
      }
      NOTE("chord +7 (%s): weakest shifted note %.1f dB re played, played notes left at %.1f dB\n",
           mode == kGrain ? "Grain" : "Smooth", db(weakest / 0.2), db(leak / 0.2));
      std::snprintf(label, sizeof label, "%s: all three notes of a chord come out shifted (weakest %.1f dB)",
                    mode == kGrain ? "Grain" : "Smooth", db(weakest / 0.2));
      EXPECT(weakest > 0.2 * 0.5, label);
      EXPECT(leak < 0.2 * 0.05, "the played notes are not in the shifted voice");
    }
  }

  // Voice B is silent at 0 and a second pitch when raised; Spread puts A on
  // the left and B on the right, and the two still add up in mono.
  {
    wet_only(device, kSmooth, 12.0f);
    device.set_param(p::kPitchB, -12.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo alone = run(device, sine(440.0f, 2.0f, kRate, 0.4f));
    const double b_off = tone_level(alone.left, 220.0, kRate, from, to) + tone_level(alone.right, 220.0, kRate, from, to);
    const double a_left = tone_level(alone.left, 880.0, kRate, from, to);
    const double a_right = tone_level(alone.right, 880.0, kRate, from, to);
    NOTE("voices: B off: 220 Hz at %.1f dB; A alone L %.1f dB R %.1f dB\n", db(b_off / 0.4), db(a_left / 0.4), db(a_right / 0.4));
    EXPECT(b_off < 0.4 * 0.003, "Voice B at 0 is silent");
    EXPECT(std::fabs(db(a_left / a_right)) < 0.1, "a single voice stays in the middle at any Spread");

    device.set_param(p::kLevelB, 1.0f);
    run(device, sine(440.0f, 0.5f, kRate, 0.4f));
    Stereo both = run(device, sine(440.0f, 2.0f, kRate, 0.4f));
    const double up_left = tone_level(both.left, 880.0, kRate, from, to), up_right = tone_level(both.right, 880.0, kRate, from, to);
    const double down_left = tone_level(both.left, 220.0, kRate, from, to), down_right = tone_level(both.right, 220.0, kRate, from, to);
    NOTE("voices: Spread 1: A L/R %.1f dB, B R/L %.1f dB\n", db(up_left / std::max(up_right, 1e-9)), db(down_right / std::max(down_left, 1e-9)));
    EXPECT(up_left > 30.0 * up_right, "Spread: voice A on the left");
    EXPECT(down_right > 30.0 * down_left, "Spread: voice B on the right");
    std::vector<float> mono(both.left.size());
    for (size_t i = 0; i < mono.size(); ++i) mono[i] = 0.5f * (both.left[i] + both.right[i]);
    const double mono_up = tone_level(mono, 880.0, kRate, from, to), mono_down = tone_level(mono, 220.0, kRate, from, to);
    NOTE("voices: in mono A %.1f dB, B %.1f dB re their side\n", db(mono_up / up_left), db(mono_down / down_right));
    EXPECT(mono_up > 0.45 * up_left && mono_down > 0.45 * down_right, "both voices survive a mono fold-down");
  }

  // Detune: A sharp and B flat by the same amount, a doubler at 0 st.
  {
    wet_only(device, kSmooth, 0.0f);
    device.set_param(p::kPitchB, 0.0f);
    device.set_param(p::kLevelB, 1.0f);
    device.set_param(p::kDetune, 20.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo out = run(device, sine(1000.0f, 2.0f, kRate, 0.4f));
    const double sharp = frequency_near(out.left, 1000.0 * std::pow(2.0, 20.0 / 1200.0), kRate, from, to);
    const double flat = frequency_near(out.right, 1000.0 * std::pow(2.0, -20.0 / 1200.0), kRate, from, to);
    NOTE("detune 20 ct: A %+.2f ct, B %+.2f ct, L/R correlation %.2f\n", cents(sharp, 1000.0), cents(flat, 1000.0),
         correlation(out.left, out.right, from, to));
    EXPECT_NEAR(cents(sharp, 1000.0), 20.0, 1.0, "Detune raises voice A");
    EXPECT_NEAR(cents(flat, 1000.0), -20.0, 1.0, "Detune lowers voice B");
  }
}

// Delay, Feedback and Tone: the shifted voice arrives late by Delay, each
// repeat is one interval further on and darker, and the loop stays bounded
// and dies away at its maximum.
static void check_feedback_and_delay() {
  char label[160];

  // Latency of the shifted voice (Smooth, default Size): where the energy
  // of a 20 ms burst comes out, against where it went in.
  double latency[3] = {0.0, 0.0, 0.0};
  {
    const float pitches[3] = {12.0f, 7.0f, -12.0f};
    for (int k = 0; k < 3; ++k) {
      for (int trial = 0; trial < 6; ++trial) {
        std::vector<float> in = sine(1000.0f, 1.5f, kRate, 0.002f);
        const size_t at = 48000 + static_cast<size_t>(trial) * 517;
        add_burst(in, at, 960, 1000.0f, 0.5f);
        wet_only(device, kSmooth, pitches[k], p::kParamDefault[p::kSize]);
        Stereo out = run(device, in);
        const double late = (energy_centre(out.left, at - 480, at + 12000) - energy_centre(in, at - 480, at + 12000)) / kRate;
        latency[k] = std::max(latency[k], late * 1000.0);
      }
    }
    NOTE("latency (Smooth, Size %.0f ms): +12 st %.1f ms, +7 st %.1f ms, -12 st %.1f ms\n", p::kParamDefault[p::kSize],
         latency[0], latency[1], latency[2]);
    std::snprintf(label, sizeof label, "Smooth: an octave up arrives within 35 ms at the default Size (%.1f ms)", latency[0]);
    EXPECT(latency[0] < 35.0, label);
    EXPECT(latency[1] < 25.0 && latency[2] < 30.0, "Smooth: a fifth up and an octave down arrive sooner still");
  }

  // Delay moves the voice later by its setting (at 0 st, where the heads
  // stand still and nothing else moves the burst).
  {
    std::vector<float> in(static_cast<size_t>(1.0f * kRate), 0.0f);
    add_burst(in, 4800, 960, 1000.0f, 0.5f);
    wet_only(device, kSmooth, 0.0f);
    Stereo near = run(device, in);
    const double tight = (energy_centre(near.left, 0, near.left.size()) - energy_centre(in, 0, in.size())) / kRate * 1000.0;
    NOTE("delay 0, 0 st: the voice is %.2f ms behind the input\n", tight);
    EXPECT(tight < 3.0, "with no shift and no Delay the voice is tight on the input");
    wet_only(device, kSmooth, 0.0f);
    device.set_param(p::kDelay, 250.0f);
    Stereo far = run(device, in);
    const double moved = (energy_centre(far.left, 0, far.left.size()) - energy_centre(near.left, 0, near.left.size())) / kRate * 1000.0;
    NOTE("delay 250 ms: the voice moves by %.2f ms\n", moved);
    EXPECT_NEAR(moved, 250.0, 2.0, "Delay makes the shifted voice arrive that much later");
  }

  // Feedback through the delay: every repeat one interval further on and
  // quieter than the last.
  for (float pitch : {12.0f, 7.0f, -12.0f}) {
    wet_only(device, kSmooth, pitch);
    device.set_param(p::kDelay, 300.0f);
    device.set_param(p::kFeedback, 0.7f);
    const float start = pitch < 0.0f ? 1760.0f : 220.0f;
    std::vector<float> in(static_cast<size_t>(1.9f * kRate), 0.0f);
    add_burst(in, 0, 9600, start, 0.5f);
    Stereo out = run(device, in);
    double worst = 0.0, previous = 1.0e9;
    bool falling = true;
    for (int k = 1; k <= 4; ++k) {
      const size_t centre = static_cast<size_t>((0.1 + k * 0.33) * kRate);
      double loudest = 0.0;
      size_t at = centre;
      for (size_t a = centre - 4800; a < centre + 4800; a += 240) {
        const double level = rms(out.left, a - 2400, a + 2400);
        if (level > loudest) {
          loudest = level;
          at = a;
        }
      }
      const double want = start * std::pow(2.0, k * pitch / 12.0);
      const double found = dominant_frequency(out.left, kRate, want * 0.8, want * 1.25, at - 2400, at + 2400);
      worst = std::max(worst, std::fabs(cents(found, want)));
      if (loudest >= previous) falling = false;
      previous = loudest;
    }
    NOTE("feedback %+.0f st: repeats 1..4 within %.1f cents of one more interval each\n", pitch, worst);
    std::snprintf(label, sizeof label, "each repeat is one more %+.0f st (worst %.1f cents)", pitch, worst);
    EXPECT(worst < 15.0, label);
    EXPECT(falling, "each repeat is quieter than the last");
  }

  // Tone darkens the voice.
  {
    rng_state() = 0x5EEDu;
    const std::vector<float> hiss = noise(1.5f, kRate, 0.3f);
    wet_only(device, kSmooth, 7.0f);
    Stereo bright = run(device, hiss);
    wet_only(device, kSmooth, 7.0f);
    device.set_param(p::kTone, 1500.0f);
    Stereo dark = run(device, hiss);
    const double open = energy_above(bright.left, 5000.0, kRate, 24000, 72000);
    const double shut = energy_above(dark.left, 5000.0, kRate, 24000, 72000);
    NOTE("tone: share of energy above 5 kHz %.3f open, %.3f at 1.5 kHz; level on noise %.1f dB re input\n", open, shut,
         db(rms(bright.left, 24000, 72000) / rms(hiss, 24000, 72000)));
    EXPECT(shut < 0.2 * open, "Tone takes the highs off the shifted voice");
  }

  // Maximum feedback, full-scale input, both voices, every mode: bounded,
  // and it dies away once the input stops.
  for (int mode : {kSmooth, kGrain, kVintage, kChords}) {
    for (float pitch : {0.0f, 12.0f}) {
      device.init(kRate);
      device.set_param(p::kMode, static_cast<float>(mode));
      device.set_param(p::kFeedback, 0.95f);
      device.set_param(p::kDelay, 60.0f);
      device.set_param(p::kPitchA, pitch);
      device.set_param(p::kPitchB, -pitch);
      device.set_param(p::kLevelB, 1.0f);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kTone, 18000.0f);
      std::vector<float> in = sine(330.0f, 5.0f, kRate, 1.0f);
      rng_state() = 0xFEEDu;
      for (float& v : in) v = std::max(-1.0f, std::min(1.0f, v + 0.3f * white()));
      Stereo out = run(device, in);
      Stereo tail = render(device, 8.0f, kRate);
      const double top = std::max(peak(out.left), peak(out.right));
      const double left_over = rms(tail.left, 7 * 48000, 8 * 48000);
      NOTE("max feedback mode %d pitch %+.0f/%+.0f: peak %.2f, 7 s after the input %.1f dB\n", mode, pitch, -pitch, top, db(left_over));
      std::snprintf(label, sizeof label, "maximum feedback stays bounded in mode %d at %+.0f st (peak %.2f)", mode, pitch, top);
      EXPECT(finite(out.left) && finite(out.right) && top <= 2.01, label);
      // Chords loses nothing on the way round, so with no shift its loop
      // really does keep 95 % a pass (a pass is the Delay and its 190 ms):
      // it falls steadily rather than fast.
      const double early = rms(tail.left, 0, 48000);
      if (mode == kChords) {
        EXPECT(left_over < 0.35 * early, "maximum feedback dies away after the input stops (Chords)");
      } else {
        EXPECT(left_over < 0.02, "maximum feedback dies away after the input stops");
      }
    }
  }
}

// Moving things while it sounds, and the plain facts: Mix 0 is the input,
// the default patch sits at the level of the input and stays mono
// compatible.
static void check_moves() {
  char label[160];

  // Mix 0 passes the input through untouched.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    const std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 0; i < tone.size(); ++i) worst = std::max(worst, std::fabs(out.left[i] - static_cast<double>(tone[i])));
    NOTE("mix 0: largest difference from the input %g\n", worst);
    EXPECT(worst == 0.0, "Mix 0 is the input, bit for bit");
  }

  // A pitch-pedal move: Pitch A from 0 up an octave and down to -12 in one
  // second each, in steps every 64 samples, on a held 220 Hz tone. The
  // steepest thing in the output should be the tone itself an octave up
  // (0.4 x 2 pi x 440 / 48000 = 0.023 per sample).
  for (int mode : {kSmooth, kGrain, kVintage}) {
    wet_only(device, mode, 0.0f);
    const std::vector<float> tone = sine(220.0f, 3.0f, kRate, 0.4f);
    Stereo out;
    out.left.resize(tone.size());
    for (size_t done = 0; done + 64 <= tone.size(); done += 64) {
      const double t = static_cast<double>(done) / kRate;
      const double pitch = t < 1.0 ? 0.0 : (t < 2.0 ? 12.0 * (t - 1.0) : 12.0 - 24.0 * (t - 2.0));
      device.set_param(p::kPitchA, static_cast<float>(pitch));
      for (int i = 0; i < 64; ++i) {
        device.in_left()[i] = tone[done + i];
        device.in_right()[i] = tone[done + i];
      }
      device.process(64);
      for (int i = 0; i < 64; ++i) out.left[done + i] = device.out_left()[i];
    }
    const double step = max_step(out.left, 48000, 144000);
    // The pitch follows the pedal: an octave up at the top of the move.
    const double top = dominant_frequency(out.left, kRate, 300.0, 600.0, 96000 - 2400, 96000 + 1200);
    NOTE("pitch sweep (mode %d): largest step %.4f, %.0f Hz at the top\n", mode, step, top);
    std::snprintf(label, sizeof label, "mode %d: a pitch sweep does not click (step %.4f)", mode, step);
    EXPECT(step < (mode == kGrain ? 0.05 : 0.03), label);
    if (mode == kSmooth) EXPECT(top > 400.0 && top < 450.0, "the pitch follows the sweep closely");
  }

  // A sudden octave jump glides in a few milliseconds without a click.
  {
    wet_only(device, kSmooth, 0.0f);
    run(device, sine(220.0f, 1.0f, kRate, 0.4f));
    device.set_param(p::kPitchA, 12.0f);
    Stereo out = run(device, sine(220.0f, 1.0f, kRate, 0.4f));
    const double arrived = dominant_frequency(out.left, kRate, 300.0, 600.0, 4800, 9600);
    NOTE("pitch jump 0 -> 12: largest step %.4f, %.1f Hz after 100 ms\n", max_step(out.left), arrived);
    EXPECT(max_step(out.left) < 0.03, "a pitch jump glides without a click");
    EXPECT_NEAR(arrived, 440.0, 2.0, "and is there within 100 ms");
  }

  // Switching Mode crossfades.
  {
    double worst = 0.0;
    for (int from_mode : {kSmooth, kGrain, kVintage}) {
      for (int to_mode : {kSmooth, kGrain, kVintage}) {
        if (from_mode == to_mode) continue;
        wet_only(device, from_mode, 7.0f);
        run(device, sine(220.0f, 1.0f, kRate, 0.4f));
        device.set_param(p::kMode, static_cast<float>(to_mode));
        Stereo out = run(device, sine(220.0f, 0.5f, kRate, 0.4f));
        worst = std::max(worst, max_step(out.left, 0, 9600));
      }
    }
    // A 330 Hz tone at 0.4 moves 0.017 per sample; grains can add to 1.6x that.
    NOTE("mode switches: largest step %.4f\n", worst);
    std::snprintf(label, sizeof label, "switching Mode while sounding does not click (step %.4f)", worst);
    EXPECT(worst < 0.035, label);
  }

  // The default patch on a sustained chord: at the level of the input, and
  // a mono source stays mono (nothing to cancel in a fold-down).
  {
    device.init(kRate);
    std::vector<float> chord(static_cast<size_t>(3.0f * kRate), 0.0f);
    for (float hz : {220.0f, 277.18f, 329.63f, 440.0f}) {
      for (int h = 1; h <= 4; ++h) {
        const std::vector<float> one = sine(hz * h, 3.0f, kRate, 0.1f / (h * h));
        for (size_t i = 0; i < chord.size(); ++i) chord[i] += one[i];
      }
    }
    Stereo out = run(device, chord);
    const double level = db(rms(out.left, 48000, 144000) / rms(chord, 48000, 144000));
    const double together = correlation(out.left, out.right, 48000, 144000);
    NOTE("default patch on a chord: %.2f dB re input, L/R correlation %.3f, peak %.2f\n", level, together, peak(out.left));
    EXPECT(std::fabs(level) < 3.0, "the default patch is within 3 dB of the input level");
    EXPECT(together > 0.99, "the default patch keeps a mono source mono");
  }
}

// Chords mode on what it is for: every note of a chord lands on its own
// shifted pitch and nothing else is there, where Smooth, splicing the sum,
// wavers. Printed side by side, always, so the difference can be read.
static void check_chords() {
  char label[200];
  const std::vector<double> c_major = {261.626, 329.628, 391.995};
  const std::vector<double> low_e = {82.407, 103.826, 123.471, 164.814};
  struct Case {
    const char* name;
    const std::vector<double>* notes;
    float pitch;
  };
  const Case cases[] = {{"C major", &c_major, 7.0f}, {"C major", &c_major, 12.0f}, {"low E major", &low_e, 7.0f}, {"low E major", &low_e, 12.0f}};
  for (const Case& c : cases) {
    const double ratio = std::pow(2.0, c.pitch / 12.0);
    const std::vector<float> in = held_notes(*c.notes, 3.5f, kRate);
    Lines found[2];
    for (int k = 0; k < 2; ++k) {
      wet_only(device, k == 0 ? kChords : kSmooth, c.pitch);
      Stereo out = run(device, in);
      found[k] = measure_lines(out.left, 96000, kRate, shifted_lines(*c.notes, ratio));
    }
    std::printf("chords: %s %+.0f st: Chords notes within %.2f ct, everything else %.1f dB | Smooth %.2f ct, %.1f dB\n", c.name,
                c.pitch, std::fabs(found[0].worst_cents), found[0].other_db, std::fabs(found[1].worst_cents), found[1].other_db);
    std::snprintf(label, sizeof label, "Chords: every note of %s %+.0f st within 3 cents (%.2f)", c.name, c.pitch, found[0].worst_cents);
    EXPECT(std::fabs(found[0].worst_cents) < 3.0 && found[0].weakest_db > -9.5, label);
    std::snprintf(label, sizeof label, "Chords: nothing but the shifted notes within 40 dB, %s %+.0f st (%.1f dB at %.0f Hz)", c.name,
                  c.pitch, found[0].other_db, found[0].other_hz);
    EXPECT(found[0].other_db < -40.0, label);
  }

  // Fuller sounds: four partials a note, so overtones of different notes
  // fall a semitone apart or nearly on top of each other (in the seventh
  // chord two of them lie 1 Hz apart and beat; Chords moves such a pair as
  // one, and what is left over sits beside it). A close seventh chord and
  // a cluster of seconds.
  const std::vector<double> seventh = {261.626, 329.628, 391.995, 493.883};
  const std::vector<double> cluster = {293.665, 329.628, 349.228};
  const Case fuller[] = {{"Cmaj7 with overtones", &seventh, 7.0f},  {"Cmaj7 with overtones", &seventh, 12.0f},
                         {"Cmaj7 with overtones", &seventh, -12.0f}, {"D E F cluster", &cluster, 7.0f},
                         {"D E F cluster", &cluster, 12.0f}};
  for (const Case& c : fuller) {
    const double ratio = std::pow(2.0, c.pitch / 12.0);
    const std::vector<float> in = held_notes(*c.notes, 3.5f, kRate, 4);
    double other[2];
    for (int k = 0; k < 2; ++k) {
      wet_only(device, k == 0 ? kChords : kSmooth, c.pitch);
      Stereo out = run(device, in);
      other[k] = measure_lines(out.left, 96000, kRate, shifted_lines(*c.notes, ratio, 4)).other_db;
    }
    std::printf("chords: %s %+.0f st: everything but the shifted partials: Chords %.1f dB | Smooth %.1f dB\n", c.name, c.pitch,
                other[0], other[1]);
    std::snprintf(label, sizeof label, "Chords: %s %+.0f st: nothing but the shifted partials within 30 dB (%.1f dB)", c.name, c.pitch,
                  other[0]);
    EXPECT(other[0] < -30.0, label);
  }
}

static std::vector<float> pink_noise(float seconds, float rate, float gain) {
  std::vector<float> x = noise(seconds, rate, gain);
  double b0 = 0.0, b1 = 0.0, b2 = 0.0;
  for (float& v : x) {
    b0 = 0.99765 * b0 + v * 0.0990460;
    b1 = 0.96300 * b1 + v * 0.2965164;
    b2 = 0.57000 * b2 + v * 1.0526913;
    v = static_cast<float>(0.3 * (b0 + b1 + b2 + v * 0.1848));
  }
  return x;
}

// Chords on plain material and as part of the device: one note, the other
// sample rates, level, an attack, moves, Delay and Feedback, the second
// voice, silence and block sizes.
static void check_chords_fit() {
  char label[200];

  // One steady note, below and above the split between its two windows.
  for (float pitch : {-12.0f, 7.0f, 12.0f}) {
    const double ratio = std::pow(2.0, pitch / 12.0);
    double worst = 0.0, flutter = 0.0, level = 0.0;
    for (float hz : {440.0f, 1000.0f, 3000.0f}) {
      wet_only(device, kChords, pitch);
      Stereo out = run(device, sine(hz, 2.0f, kRate, 0.5f));
      const double found = frequency_near(out.left, hz * ratio, kRate, 48000, 96000);
      worst = std::max(worst, found > 0.0 ? std::fabs(cents(found, hz * ratio)) : 1200.0);
      flutter = std::max(flutter, flutter_db(out.left, 48000, 96000, 1200));
      const double off = db(rms(out.left, 48000, 96000) / (0.5 / std::sqrt(2.0)));
      if (std::fabs(off) > std::fabs(level)) level = off;
    }
    NOTE("chords: one note %+.0f st: worst error %.3f cents, flutter %.2f dB, level %+.2f dB\n", pitch, worst, flutter, level);
    std::snprintf(label, sizeof label, "Chords: one note lands within 1 cent at %+.0f st (%.3f)", pitch, worst);
    EXPECT(worst < 1.0, label);
    std::snprintf(label, sizeof label, "Chords: one note is steady at %+.0f st (flutter %.2f dB, level %+.2f dB)", pitch, flutter, level);
    EXPECT(flutter < 0.5 && std::fabs(level) < 0.5, label);
  }

  // The other sample rates: the windows are the same length in time.
  for (float rate : {44100.0f, 96000.0f}) {
    double worst = 0.0;
    for (float hz : {440.0f, 2000.0f}) {
      device.init(rate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kMode, kChords);
      device.set_param(p::kPitchA, 7.0f);
      device.set_param(p::kTone, 18000.0f);
      Stereo out = run(device, sine(hz, 2.0f, rate, 0.5f));
      const double want = hz * std::pow(2.0, 7.0 / 12.0);
      const double found = frequency_near(out.left, want, rate, static_cast<size_t>(rate), static_cast<size_t>(2.0f * rate));
      worst = std::max(worst, found > 0.0 ? std::fabs(cents(found, want)) : 1200.0);
    }
    NOTE("chords: at %.0f Hz: worst error %.3f cents\n", rate, worst);
    std::snprintf(label, sizeof label, "Chords: within 1 cent at %.0f Hz (%.3f)", rate, worst);
    EXPECT(worst < 1.0, label);
  }

  // Level against what went in: a held chord, and pink noise (which no
  // phase vocoder keeps whole: its frames stop agreeing where there is no
  // steady partial to follow, and at +12 the top octave has nowhere to go).
  {
    const std::vector<float> held = held_notes({130.81, 164.81, 196.0, 261.63, 329.63}, 3.0f, kRate);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> pink = pink_noise(4.0f, kRate, 0.25f);
    double chord_off = 0.0, pink_off[3] = {0.0, 0.0, 0.0};
    int k = 0;
    for (float pitch : {7.0f, 12.0f, -12.0f}) {
      wet_only(device, kChords, pitch);
      Stereo a = run(device, held);
      const double off = db(rms(a.left, 72000, held.size()) / rms(held, 72000, held.size()));
      if (std::fabs(off) > std::fabs(chord_off)) chord_off = off;
      wet_only(device, kChords, pitch);
      Stereo b = run(device, pink);
      pink_off[k++] = db(rms(b.left, 72000, pink.size()) / rms(pink, 72000, pink.size()));
    }
    NOTE("chords: level re input: held chord %+.2f dB; pink noise %+.2f dB at +7, %+.2f at +12, %+.2f at -12\n", chord_off,
         pink_off[0], pink_off[1], pink_off[2]);
    std::snprintf(label, sizeof label, "Chords: a held chord comes out at its own level (%+.2f dB)", chord_off);
    EXPECT(std::fabs(chord_off) < 0.5, label);
    std::snprintf(label, sizeof label, "Chords: pink noise within 1.5 dB at +7 st (%+.2f dB)", pink_off[0]);
    EXPECT(std::fabs(pink_off[0]) < 1.5, label);
    std::snprintf(label, sizeof label, "Chords: pink noise within 2.5 dB an octave either way (%+.2f, %+.2f dB)", pink_off[1], pink_off[2]);
    EXPECT(std::fabs(pink_off[1]) < 2.5 && std::fabs(pink_off[2]) < 2.5, label);
  }

  // A plucked note (3 ms attack, eight harmonics): it arrives once, about
  // 190 ms late, with next to nothing ahead of it. "Arrives" is where the
  // 5 ms level first reaches half its peak; what is ahead is the 30 ms
  // before that, less the last 5 ms, which are the attack itself.
  {
    struct Pluck {
      float hz, pitch;
    };
    double worst_ahead = -200.0, earliest = 1.0e9, latest = 0.0;
    for (const Pluck& n : {Pluck{220.0f, 7.0f}, Pluck{110.0f, 12.0f}, Pluck{880.0f, -12.0f}, Pluck{329.63f, 12.0f}}) {
      std::vector<float> in(static_cast<size_t>(1.5f * kRate), 0.0f);
      const size_t onset = 24000;
      for (size_t i = onset; i < in.size(); ++i) {
        const double t = static_cast<double>(i - onset) / kRate;
        double v = 0.0;
        for (int h = 1; h <= 8; ++h) v += std::sin(2.0 * kPi * n.hz * h * t + 0.7 * h) / h;
        in[i] = static_cast<float>(0.2 * std::min(1.0, t / 0.003) * std::exp(-t / 0.9) * v);
      }
      wet_only(device, kChords, n.pitch);
      Stereo out = run(device, in);
      double top = 0.0;
      for (size_t a = onset; a + 240 <= out.left.size(); a += 48) top = std::max(top, rms(out.left, a, a + 240));
      size_t arrival = onset;
      while (arrival + 240 < out.left.size() && rms(out.left, arrival, arrival + 240) < 0.5 * top) arrival += 48;
      const double ahead = db(rms(out.left, arrival - 1680, arrival - 240) / rms(out.left, arrival, arrival + 1440));
      const double late = static_cast<double>(arrival - onset) / kRate * 1000.0;
      NOTE("chords: pluck %.0f Hz %+.0f st: arrives %.1f ms late, the 30 ms ahead of it %.1f dB under\n", n.hz, n.pitch, late, ahead);
      worst_ahead = std::max(worst_ahead, ahead);
      earliest = std::min(earliest, late);
      latest = std::max(latest, late);
    }
    std::snprintf(label, sizeof label, "Chords: an attack arrives once, the 30 ms before it 25 dB down (%.1f dB)", worst_ahead);
    EXPECT(worst_ahead < -25.0, label);
    std::snprintf(label, sizeof label, "Chords: answers between 180 and 200 ms late (%.1f to %.1f ms)", earliest, latest);
    EXPECT(earliest > 180.0 && latest < 200.0, label);
  }
}

// Chords with the rest of the device: Delay, Feedback, the second voice,
// and moving Mode or Pitch while it sounds.
static void check_chords_moves() {
  char label[200];

  // Delay moves the voice later by its setting.
  {
    std::vector<float> in(static_cast<size_t>(1.5f * kRate), 0.0f);
    add_burst(in, 4800, 960, 1000.0f, 0.5f);
    wet_only(device, kChords, 7.0f);
    Stereo near = run(device, in);
    wet_only(device, kChords, 7.0f);
    device.set_param(p::kDelay, 250.0f);
    Stereo far = run(device, in);
    const double behind = (energy_centre(near.left, 0, near.left.size()) - energy_centre(in, 0, in.size())) / kRate * 1000.0;
    const double moved = (energy_centre(far.left, 0, far.left.size()) - energy_centre(near.left, 0, near.left.size())) / kRate * 1000.0;
    NOTE("chords: a burst comes out %.1f ms late; Delay 250 ms moves it by %.2f ms\n", behind, moved);
    EXPECT_NEAR(moved, 250.0, 2.0, "Chords: Delay makes the shifted voice arrive that much later");
  }

  // Feedback: every repeat one interval further on and quieter.
  for (float pitch : {12.0f, -7.0f}) {
    wet_only(device, kChords, pitch);
    device.set_param(p::kDelay, 300.0f);
    device.set_param(p::kFeedback, 0.7f);
    const float start = pitch < 0.0f ? 1760.0f : 220.0f;
    std::vector<float> in(static_cast<size_t>(2.7f * kRate), 0.0f);
    add_burst(in, 0, 9600, start, 0.5f);
    Stereo out = run(device, in);
    double worst = 0.0, previous = 1.0e9;
    bool falling = true;
    for (int k = 1; k <= 4; ++k) {
      const size_t centre = static_cast<size_t>((0.1 + k * 0.492) * kRate);
      double loudest = 0.0;
      size_t at = centre;
      for (size_t a = centre - 4800; a < centre + 4800; a += 240) {
        const double level = rms(out.left, a - 2400, a + 2400);
        if (level > loudest) {
          loudest = level;
          at = a;
        }
      }
      const double want = start * std::pow(2.0, k * pitch / 12.0);
      const double found = dominant_frequency(out.left, kRate, want * 0.8, want * 1.25, at - 2400, at + 2400);
      worst = std::max(worst, std::fabs(cents(found, want)));
      if (loudest >= previous) falling = false;
      previous = loudest;
    }
    NOTE("chords: feedback %+.0f st: repeats 1..4 within %.1f cents of one more interval each\n", pitch, worst);
    std::snprintf(label, sizeof label, "Chords: each repeat is one more %+.0f st (worst %.1f cents)", pitch, worst);
    EXPECT(worst < 15.0 && falling, label);
  }

  // The second voice and Spread.
  {
    wet_only(device, kChords, 12.0f);
    device.set_param(p::kPitchB, -12.0f);
    device.set_param(p::kLevelB, 1.0f);
    device.set_param(p::kSpread, 1.0f);
    device.set_param(p::kDetune, 10.0f);
    Stereo out = run(device, sine(440.0f, 2.5f, kRate, 0.4f));
    const double up = 880.0 * std::pow(2.0, 10.0 / 1200.0), down = 220.0 * std::pow(2.0, -10.0 / 1200.0);
    const double up_left = tone_level(out.left, up, kRate, 72000, 120000), up_right = tone_level(out.right, up, kRate, 72000, 120000);
    const double down_left = tone_level(out.left, down, kRate, 72000, 120000), down_right = tone_level(out.right, down, kRate, 72000, 120000);
    NOTE("chords: voices at Spread 1, Detune 10: A %.1f dB re input, L/R %.1f dB; B %.1f dB, R/L %.1f dB\n", db(up_left / 0.4),
         db(up_left / std::max(up_right, 1e-9)), db(down_right / 0.4), db(down_right / std::max(down_left, 1e-9)));
    EXPECT(up_left > 0.9 * 0.4 && up_left > 30.0 * up_right, "Chords: voice A, detuned up, on the left");
    EXPECT(down_right > 0.9 * 0.4 && down_right > 30.0 * down_left, "Chords: voice B, detuned down, on the right");
  }
}

// Turning to Chords and away from it, sweeping Pitch in it, block sizes and
// the silence after it.
static void check_chords_switch() {
  char label[200];

  // A 220 Hz tone up a fifth is 330 Hz at 0.4: 0.017 a sample; two modes
  // crossing can add to 1.4 times that.
  {
    double worst = 0.0, deepest = 0.0;
    for (int other : {kSmooth, kGrain, kVintage}) {
      for (int to_chords = 0; to_chords < 2; ++to_chords) {
        wet_only(device, to_chords ? other : kChords, 7.0f);
        run(device, sine(220.0f, 1.0f, kRate, 0.4f));
        device.set_param(p::kMode, static_cast<float>(to_chords ? kChords : other));
        Stereo out = run(device, sine(220.0f, 0.6f, kRate, 0.4f));
        worst = std::max(worst, max_step(out.left));
        for (size_t a = 0; a + 960 <= out.left.size(); a += 480) {
          deepest = std::min(deepest, db(rms(out.left, a, a + 960) / (0.4 / std::sqrt(2.0))));
        }
      }
    }
    NOTE("chords: mode switches to and from Chords: largest step %.4f, deepest 20 ms dip %.1f dB\n", worst, deepest);
    std::snprintf(label, sizeof label, "switching to and from Chords does not click (step %.4f)", worst);
    EXPECT(worst < 0.035, label);
    std::snprintf(label, sizeof label, "switching to and from Chords leaves no hole (dip %.1f dB)", deepest);
    EXPECT(deepest > -12.0, label);
  }

  // The pitch-pedal move of check_moves, in Chords.
  {
    wet_only(device, kChords, 0.0f);
    const std::vector<float> tone = sine(220.0f, 3.5f, kRate, 0.4f);
    std::vector<float> out(tone.size(), 0.0f);
    for (size_t done = 0; done + 64 <= tone.size(); done += 64) {
      const double t = static_cast<double>(done) / kRate;
      const double pitch = t < 1.0 ? 0.0 : (t < 2.0 ? 12.0 * (t - 1.0) : (t < 3.0 ? 12.0 - 24.0 * (t - 2.0) : -12.0));
      device.set_param(p::kPitchA, static_cast<float>(pitch));
      for (int i = 0; i < 64; ++i) {
        device.in_left()[i] = tone[done + i];
        device.in_right()[i] = tone[done + i];
      }
      device.process(64);
      for (int i = 0; i < 64; ++i) out[done + i] = device.out_left()[i];
    }
    const double step = max_step(out, 48000, 160000);
    const double level = db(rms(out, 57600, 153600) / (0.4 / std::sqrt(2.0)));
    NOTE("chords: pitch sweep: largest step %.4f, level through the sweep %+.2f dB\n", step, level);
    std::snprintf(label, sizeof label, "Chords: a pitch sweep does not click (step %.4f) and keeps its level (%+.2f dB)", step, level);
    EXPECT(step < 0.03 && level > -2.0, label);
  }

  // The same output whatever the block size, and exact silence afterwards.
  {
    rng_state() = 0xB10Cu;
    std::vector<float> in = noise(1.2f, kRate, 0.2f);
    const std::vector<float> tone = sine(196.0f, 1.2f, kRate, 0.3f);
    for (size_t i = 0; i < in.size(); ++i) in[i] += tone[i];
    Stereo reference;
    bool same = true;
    for (int block : {128, 1, 2048}) {
      device.init(kRate);
      device.set_param(p::kMode, kChords);
      device.set_param(p::kLevelB, 0.8f);
      device.set_param(p::kDelay, 120.0f);
      device.set_param(p::kFeedback, 0.4f);
      Stereo out = run(device, in, in, block);
      if (block == 128) {
        reference = out;
        continue;
      }
      for (size_t i = 0; i < out.left.size(); ++i) {
        if (out.left[i] != reference.left[i] || out.right[i] != reference.right[i]) same = false;
      }
    }
    EXPECT(same, "Chords: blocks of 1, 128 and 2048 frames give the same samples");
    Stereo tail = render(device, 12.0f, kRate);
    const double last = std::max(peak(tail.left, 11 * 48000, 12 * 48000), peak(tail.right, 11 * 48000, 12 * 48000));
    NOTE("chords: last second of 12 s of silence: peak %g\n", last);
    EXPECT(last == 0.0, "Chords: exact silence once the tail is over");
  }
}

// Review additions -------------------------------------------------------------------------

// A held chord of a few notes with falling overtones, to stand for playing.
static std::vector<float> review_chord(float seconds, float rate) {
  std::vector<float> chord(static_cast<size_t>(seconds * rate), 0.0f);
  for (float hz : {110.0f, 164.81f, 196.0f, 261.63f}) {
    for (int h = 1; h <= 6; ++h) {
      const std::vector<float> one = sine(hz * h, seconds, rate, 0.08f / h);
      for (size_t i = 0; i < chord.size(); ++i) chord[i] += one[i];
    }
  }
  return chord;
}

// Bad input samples in the middle of playing, with Feedback up, in every
// mode: not-a-number, both infinities and an absurd magnitude. Before the
// input was sanitised one such sample lodged in the record filters and the
// ring: Smooth, Grain and Vintage put out not-a-number for good and the
// Chords voices fell silent for good.
static void check_bad_input() {
  const std::vector<float> clean = review_chord(4.0f, kRate);
  std::vector<float> left = clean, right = clean;
  left[48000] = std::nanf("");
  right[48010] = HUGE_VALF;
  left[60000] = 1.0e30f;
  right[72000] = -HUGE_VALF;
  left[72001] = -1.0e30f;
  const std::vector<float> quiet = silence(14.0f, kRate);
  char label[160];
  for (int mode = 0; mode <= kChords; ++mode) {
    const auto prepare = [&]() {
      device.init(kRate);
      device.set_param(p::kMode, static_cast<float>(mode));
      device.set_param(p::kPitchA, 7.0f);
      device.set_param(p::kLevelB, 0.7f);
      device.set_param(p::kFeedback, 0.8f);
      device.set_param(p::kDelay, 200.0f);
    };
    prepare();
    const Stereo reference = run(device, clean);
    prepare();
    const Stereo out = run(device, left, right);
    const Stereo tail = run(device, quiet);
    const double level = db(rms(out.left, 144000, 192000) / rms(reference.left, 144000, 192000));
    bool silent = true;
    for (size_t i = tail.left.size() - 48000; i < tail.left.size(); ++i) {
      silent = silent && tail.left[i] == 0.0f && tail.right[i] == 0.0f;
    }
    const double top = std::max(peak(out.left), peak(out.right));
    NOTE("bad input, mode %d: finite %d, peak %.2f, level a second later %+.2f dB re clean, sleeps %d\n", mode,
         finite(out.left) && finite(out.right) && finite(tail.left) && finite(tail.right), top, level, silent);
    std::snprintf(label, sizeof label, "mode %d stays finite and bounded through bad input samples (peak %.2f)", mode, top);
    EXPECT(finite(out.left) && finite(out.right) && finite(tail.left) && finite(tail.right) && top < 12.0, label);
    std::snprintf(label, sizeof label, "mode %d is back at its level a second after bad input (%+.2f dB)", mode, level);
    EXPECT(std::fabs(level) < 1.0, label);
    std::snprintf(label, sizeof label, "mode %d still reaches exact zeros after bad input", mode);
    EXPECT(silent, label);
  }
}
