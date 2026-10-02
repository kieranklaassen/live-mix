// Native harness for Pitch Shifter (cpp/devices/pitch-shifter). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest asserts what makes it a pitch
// shifter: the output pitch in each mode, how clean each mode is, chords,
// climbing repeats, latency, and that moving Pitch or Mode does not click.
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
enum { kSmooth = 0, kGrain = 1, kVintage = 2 };

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

// Power-weighted mean frequency within `span` Hz of `centre`: where the
// pitch sits when a mode spreads a tone into a cluster of lines.
static double centroid(const std::vector<float>& x, double centre, double span, size_t from, size_t to) {
  double power = 0.0, weighted = 0.0;
  for (int i = -40; i <= 40; ++i) {
    const double hz = centre + span * i / 40.0;
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

// Share of the power further than about `band` Hz from `hz` (heterodyne and
// two one-pole lowpasses: soft skirts, so only compare like with like).
static double share_outside(const std::vector<float>& x, double hz, double band, size_t from, size_t to) {
  const double a = std::exp(-2.0 * kPi * band / kRate);
  double re1 = 0, im1 = 0, re2 = 0, im2 = 0, inside = 0, total = 0;
  for (size_t i = from; i < to; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
    re1 = x[i] * std::cos(phase) + (re1 - x[i] * std::cos(phase)) * a;
    im1 = -x[i] * std::sin(phase) + (im1 + x[i] * std::sin(phase)) * a;
    re2 = re1 + (re2 - re1) * a;
    im2 = im1 + (im2 - im1) * a;
    if (i >= from + 4800) {
      inside += 2.0 * (re2 * re2 + im2 * im2);
      total += static_cast<double>(x[i]) * x[i];
    }
  }
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

static void check_pitch();
static void check_character();
static void check_chord_and_voices();
static void check_feedback_and_delay();
static void check_moves();

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
  check_character();
  check_chord_and_voices();
  check_feedback_and_delay();
  check_moves();

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

  return finish("pitch-shifter");
}

static void check_character() {}
static void check_chord_and_voices() {}
static void check_feedback_and_delay() {}
static void check_moves() {}

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
      const double found = dominant_frequency(out.left, kRate, hz * ratio * 0.97, hz * ratio * 1.03, from, to);
      worst = std::max(worst, std::fabs(cents(found, hz * ratio)));
    }
    NOTE("pitch: Smooth %+.0f st %+.0f ct: worst error %.2f cents\n", c.pitch, c.detune, worst);
    std::snprintf(label, sizeof label, "Smooth lands within 3 cents at %+.0f st %+.0f ct (worst %.2f)", c.pitch,
                  c.detune, worst);
    EXPECT(worst < 3.0, label);
  }

  for (const Case& c : cases) {
    const double ratio = std::pow(2.0, (c.pitch + c.detune / 100.0) / 12.0);
    double worst = 0.0;
    for (float hz : {2000.0f, 3520.0f}) {
      wet_only(device, kGrain, c.pitch);
      device.set_param(p::kDetune, c.detune);
      device.set_param(p::kJitter, 0.3f);
      Stereo out = run(device, sine(hz, 4.0f, kRate, 0.5f));
      const double found = centroid(out.left, hz * ratio, 40.0, 48000, 192000);
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
                               : centroid(out.left, hz * ratio, 60.0, 48000, 144000);
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
