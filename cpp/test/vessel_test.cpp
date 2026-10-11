// Native harness for Vessel (cpp/devices/vessel). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest holds the device to the laws in bodies.h: where each body's
// resonances are and how Size moves them, how long Material lets them ring,
// what Position, Opening, Width, Tone and Air do, and that the level stays
// near the input's whatever is played into it.

#include "../devices/vessel/vessel.h"
#include "support/test_kit.h"

#include <cstdlib>
#include <cstring>

using namespace testkit;
using livemix::Vessel;
namespace p = livemix::vessel;
namespace vd = livemix::vessel_dsp;

// VESSEL_VERBOSE=1 prints every measurement, not only the failures.
static bool verbose() {
  static const bool on = std::getenv("VESSEL_VERBOSE") != nullptr;
  return on;
}
#define SHOW(condition, message)                         \
  do {                                                   \
    if (verbose()) std::printf("  %s\n", message);       \
    EXPECT(condition, message);                          \
  } while (0)
#define SHOW_NEAR(actual, expected, tolerance, message)                                             \
  do {                                                                                              \
    if (verbose()) std::printf("  %s: %g (expected %g)\n", message, static_cast<double>(actual),    \
                               static_cast<double>(expected));                                      \
    EXPECT_NEAR(actual, expected, tolerance, message);                                              \
  } while (0)

static Vessel device;
static Vessel other;

static const float kRate = 48000.0f;
static const char* const kBodyNames[vd::kNumBodies] = {"bottle", "open pipe", "stopped pipe",
                                                      "shell",  "drum",      "soundboard"};

// Only the body: no dry signal, no direct sound, no noise, both ears together.
static void inside(Vessel& d, float rate, int body) {
  d.init(rate);
  d.set_param(p::kBody, static_cast<float>(body));
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kOpening, 0.0f);
  d.set_param(p::kAir, 0.0f);
  d.set_param(p::kWidth, 0.0f);
}

// Equal power in every octave (Kellet's filter on white noise), RMS `gain`.
static std::vector<float> pink(float seconds, float rate, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  double b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (float& v : out) {
    const double w = white();
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    v = static_cast<float>(b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362);
    b6 = w * 0.115926;
  }
  const double level = rms(out);
  for (float& v : out) v = static_cast<float>(v * gain / level);
  return out;
}

// A played phrase: eight notes of six decaying partials, half a second apart.
static std::vector<float> phrase(float seconds, float rate, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  const float notes[] = {220.0f, 277.18f, 329.63f, 440.0f, 164.81f, 392.0f, 246.94f, 523.25f};
  const size_t gap = static_cast<size_t>(0.5f * rate);
  int n = 0;
  for (size_t start = 0; start < out.size(); start += gap, ++n) {
    const float hz = notes[n % 8];
    for (size_t i = start; i < out.size() && i < start + 3 * gap; ++i) {
      const double t = static_cast<double>(i - start) / rate;
      const double env = std::exp(-t * 2.5) * (1.0 - std::exp(-t * 400.0));
      double s = 0.0;
      for (int h = 1; h <= 6; ++h) s += std::sin(2.0 * kPi * hz * h * t) / (h * h);
      out[i] += static_cast<float>(gain * env * s);
    }
  }
  return out;
}

// Three held notes summing to a peak of `gain`.
static std::vector<float> chord(float seconds, float rate, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    out[i] = static_cast<float>(gain / 3.0 *
                                (std::sin(2.0 * kPi * 130.81 * t) + std::sin(2.0 * kPi * 196.0 * t) +
                                 std::sin(2.0 * kPi * 261.63 * t)));
  }
  return out;
}

// The 60 dB time of the component at `hz`: from its level in two windows.
static double tone_t60(const std::vector<float>& x, double hz, double rate, double t0, double t1,
                       double window) {
  const auto at = [&](double t) {
    return tone_level(x, hz, rate, static_cast<size_t>(t * rate), static_cast<size_t>((t + window) * rate));
  };
  const double fall = db(at(t0)) - db(at(t1));
  return fall > 0.0 ? 60.0 * (t1 - t0) / fall : 0.0;
}

static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// The settings of the sixteen presets (device.json), for the level checks:
// body, size, material, opening, position, air, tone, width, mix.
struct Preset {
  const char* name;
  float values[p::kNumParams];
};
// Which control each column of the table is, by key: the table stands in this
// order whatever the order of the controls in device.json.
static const int kColumns[p::kNumParams] = {p::kBody, p::kSize, p::kMaterial, p::kOpening, p::kPosition,
                                            p::kAir,  p::kTone, p::kWidth,    p::kMix};
static float value_of(const Preset& preset, int id) {
  for (int column = 0; column < p::kNumParams; ++column) {
    if (kColumns[column] == id) return preset.values[column];
  }
  std::abort();
}
static const char* name_of(int id) {
  switch (id) {
    case p::kBody: return "Body";
    case p::kSize: return "Size";
    case p::kMaterial: return "Material";
    case p::kOpening: return "Opening";
    case p::kPosition: return "Position";
    case p::kAir: return "Air";
    case p::kTone: return "Tone";
    case p::kWidth: return "Width";
    case p::kMix: return "Mix";
  }
  std::abort();
}
static const Preset kPresets[] = {
    {"Inside a pipe", {1, 1, 0.5f, 0.5f, 0.3f, 0.2f, 0.5f, 0.5f, 0.7f}},
    {"Blown bottle", {0, 1, 0.7f, 0.3f, 0.3f, 0.6f, 0.5f, 0.5f, 0.75f}},
    {"Shell to the ear", {3, 1.2f, 0.45f, 0.2f, 0.3f, 0.85f, 0.5f, 1, 0.6f}},
    {"Wooden body", {5, 1, 0.45f, 0.7f, 0.4f, 0, 0.5f, 0.5f, 0.6f}},
    {"Drum head", {4, 1, 0.55f, 0.6f, 0.25f, 0.05f, 0.5f, 0.5f, 0.7f}},
    {"Cistern", {2, 4, 0.85f, 0.4f, 0.3f, 0.3f, 0.5f, 0.8f, 0.65f}},
    {"Thimble", {0, 0.25f, 0.6f, 0.6f, 0.3f, 0.2f, 0.6f, 0.5f, 0.5f}},
    {"Glass tube", {1, 0.5f, 0.9f, 0.5f, 0.15f, 0.1f, 0.65f, 0.5f, 0.5f}},
    {"Clay pot", {0, 1.682f, 0.15f, 0.2f, 0.3f, 0.1f, 0.35f, 0.5f, 0.85f}},
    {"Hint of wood", {5, 0.8f, 0.3f, 1, 0.3f, 0, 0.5f, 0.5f, 0.25f}},
    {"Metal drone", {2, 2, 1, 0.5f, 0.1f, 0.25f, 0.5f, 1, 0.8f}},
    {"Whispering shell", {3, 0.6f, 0.7f, 0.1f, 0.3f, 0.8f, 0.7f, 1, 0.45f}},
    {"Kettle", {4, 2, 0.8f, 0.35f, 0.6f, 0.2f, 0.5f, 0.5f, 0.7f}},
    {"Small tin", {4, 0.25f, 0.75f, 0.8f, 0.3f, 0.2f, 0.7f, 0.5f, 0.6f}},
    {"Wind in the pipe", {1, 2, 0.6f, 0, 0.3f, 1, 0.5f, 0.8f, 1}},
    {"Deep well", {0, 3, 0.9f, 0.5f, 0.3f, 0.4f, 0.4f, 0.6f, 0.7f}},
};

static void load(Vessel& d, float rate, const Preset& preset) {
  d.init(rate);
  for (int column = 0; column < p::kNumParams; ++column) d.set_param(kColumns[column], preset.values[column]);
}

static void check_resonances();
static void check_decay();
static void check_shape_controls();
static void check_width_and_range();
static void check_air();
static void check_clicks();
static void check_levels();
static void check_mix_dips();
static void check_housekeeping();
// The second check's own measurements (each failed on the device as first built).
static void check_first_note();
static void check_played_line();
static void check_tails_and_distortion();
static void check_air_level();
static void check_every_third();
static void check_mono_sum();
static void check_thrown_size();
static void check_full_scale();
static void check_held_start();

int main() {
  livemix::kit::SineTable::init();
  Conformance spec;
  spec.name = "vessel";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  check_resonances();
  check_decay();
  check_shape_controls();
  check_width_and_range();
  check_air();
  check_clicks();
  check_levels();
  check_mix_dips();
  check_housekeeping();
  check_first_note();
  check_played_line();
  check_tails_and_distortion();
  check_air_level();
  check_every_third();
  check_mono_sum();
  check_thrown_size();
  check_full_scale();
  check_held_start();

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("vessel", 10.0f, kRate, [&] { run(device, input); });

  return finish("vessel");
}

// The strongest frequency within 2.5 % of `near`.
static double peak_near(const std::vector<float>& x, double near, double rate, size_t from, size_t to) {
  double best_hz = near, best = -1.0, span = near * 0.025;
  for (int pass = 0; pass < 3; ++pass) {
    const double centre = best_hz;
    for (int i = -12; i <= 12; ++i) {
      const double hz = centre + span * i / 12.0;
      const double level = tone_level(x, hz, rate, from, to);
      if (level > best) {
        best = level;
        best_hz = hz;
      }
    }
    span /= 8.0;
  }
  return best_hz;
}

// For each body, at three sample rates and three sizes: the resonances an
// impulse leaves ringing are at the table's frequencies over Size.
static void check_resonances() {
  char label[200];
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (int b = 0; b < vd::kNumBodies; ++b) {
      const vd::Body& body = vd::kBodies[b];
      double lowest[3] = {0.0, 0.0, 0.0};
      int which = 0;
      for (float size : {0.5f, 1.0f, 2.0f}) {
        inside(device, rate, b);
        device.set_param(p::kSize, size);
        device.set_param(p::kMaterial, 0.8f);
        Stereo out = run(device, impulse(0.5f, rate, 0.5f));
        const size_t from = static_cast<size_t>(0.02f * rate), to = static_cast<size_t>(0.45f * rate);
        const float x = vd::listen_at(body, p::kParamDefault[p::kPosition]);
        int tested = 0;
        double worst = 0.0;
        for (int k = 0; k < body.count && tested < 6; ++k) {
          const vd::Mode& mode = body.modes[k];
          const float hz = vd::mode_hz(body, k, size);
          // Only where the mode speaks at this place, is inside the range,
          // and stands clear of its neighbours.
          if (vd::mode_shape(mode, x) < 0.3f || vd::in_range(hz, rate) < 1.0f) continue;
          if (k > 0 && mode.ratio / body.modes[k - 1].ratio < 1.07f) continue;
          if (k + 1 < body.count && body.modes[k + 1].ratio / mode.ratio < 1.07f) continue;
          const double measured = peak_near(out.left, hz, rate, from, to);
          const double error = std::fabs(measured - hz) / std::max(0.004 * hz, 0.6);
          worst = std::max(worst, error);
          if (k == 0) lowest[which] = measured;
          ++tested;
        }
        std::snprintf(label, sizeof label,
                      "%s, %.0f Hz, Size %.1f: %d resonances at the model's frequencies (worst %.2f of the tolerance)",
                      kBodyNames[b], rate, size, tested, worst);
        SHOW(tested >= 3 && worst <= 1.0, label);
        ++which;
      }
      std::snprintf(label, sizeof label, "%s, %.0f Hz: the lowest resonance is the table's over Size",
                    kBodyNames[b], rate);
      SHOW_NEAR(lowest[0] / lowest[2], 4.0, 0.03, label);
      SHOW_NEAR(lowest[1], body.base_hz, std::max(0.004 * body.base_hz, 0.6), label);
    }
  }

  // The open pipe's resonances are evenly spaced: every multiple of the
  // lowest rings, and half way between two of them there is nearly nothing.
  // Stopped, the tube is an octave lower and only the odd multiples ring.
  for (int b : {1, 2}) {
    inside(device, kRate, b);
    device.set_param(p::kMaterial, 0.8f);
    device.set_param(p::kOpening, 1.0f);  // every mode at its table strength
    // A place where each of the first eight speaks: a tenth of the way along
    // the open tube, at the stopped end of the stopped one.
    device.set_param(p::kPosition, b == 1 ? 0.149f : 0.0f);
    Stereo out = run(device, impulse(1.0f, kRate, 0.5f));
    const size_t from = 2400, to = 36000;
    const double f0 = vd::kBodies[b].base_hz;
    double weakest_on = 1.0e9, strongest_off = 0.0;
    for (int k = 1; k <= 8; ++k) {
      const double on = b == 1 ? k * f0 : (2 * k - 1) * f0;
      const double off = b == 1 ? (k + 0.5) * f0 : 2 * k * f0;
      weakest_on = std::min(weakest_on, tone_level(out.left, on, kRate, from, to));
      strongest_off = std::max(strongest_off, tone_level(out.left, off, kRate, from, to));
    }
    std::snprintf(label, sizeof label, "%s: its multiples ring %.1f dB over what lies between them",
                  kBodyNames[b], db(weakest_on / strongest_off));
    SHOW(weakest_on > 10.0 * strongest_off, label);
  }
  SHOW_NEAR(vd::kBodies[2].base_hz * 2.0, vd::kBodies[1].base_hz, 0.02,
              "the stopped pipe is the open one an octave down");
}

// Material is the time the slowest resonance takes to fall 60 dB, the same
// at every Size, and the upper ones die sooner by the stated law.
static void check_decay() {
  char label[200];
  const auto bottle_t60 = [&](float material, float size, float rate) {
    inside(device, rate, 0);
    device.set_param(p::kMaterial, material);
    device.set_param(p::kSize, size);
    const double expected = vd::ring_seconds(material);
    const double window = std::min(0.2, expected / 4.0);
    Stereo out = run(device, impulse(static_cast<float>(0.1 + expected / 2.0 + window + 0.05), rate, 0.5f));
    return tone_t60(out.left, vd::kBodies[0].base_hz / size, rate, 0.05, 0.05 + expected / 2.0, window);
  };
  for (float material : {0.4f, 0.6f, 0.8f, 1.0f}) {
    const double expected = vd::ring_seconds(material);
    const double measured = bottle_t60(material, 1.0f, kRate);
    std::snprintf(label, sizeof label, "Material %.1f: the bottle's resonance rings %.3f s (law %.3f s)",
                  material, measured, expected);
    SHOW_NEAR(measured, expected, 0.06 * expected, label);
  }
  SHOW_NEAR(vd::ring_seconds(0.0f), 0.04, 1.0e-4, "Material 0 is 40 ms");
  SHOW_NEAR(vd::ring_seconds(1.0f), 4.0, 1.0e-3, "Material 1 is 4 s");
  for (float size : {0.5f, 2.0f}) {
    const double measured = bottle_t60(0.7f, size, kRate);
    std::snprintf(label, sizeof label, "Size %.1f: the ring time does not move with Size (%.3f s)", size,
                  measured);
    SHOW_NEAR(measured, vd::ring_seconds(0.7f), 0.06 * vd::ring_seconds(0.7f), label);
  }
  for (float rate : {44100.0f, 96000.0f}) {
    const double measured = bottle_t60(0.7f, 1.0f, rate);
    std::snprintf(label, sizeof label, "%.0f Hz: the ring time is the same (%.3f s)", rate, measured);
    SHOW_NEAR(measured, vd::ring_seconds(0.7f), 0.06 * vd::ring_seconds(0.7f), label);
  }

  // The fourth resonance of the open pipe against the first.
  for (float material : {0.5f, 0.9f}) {
    inside(device, kRate, 1);
    device.set_param(p::kMaterial, material);
    Stereo out = run(device, impulse(3.0f, kRate, 0.5f));
    const vd::Body& pipe = vd::kBodies[1];
    const double first = vd::mode_seconds(pipe.modes[0], material);
    const double fourth = vd::mode_seconds(pipe.modes[3], material);
    const double m1 = tone_t60(out.left, pipe.base_hz, kRate, 0.05, 0.05 + first / 2.5, first / 5.0);
    const double m4 = tone_t60(out.left, 4.0 * pipe.base_hz, kRate, 0.05, 0.05 + fourth / 2.5, fourth / 5.0);
    std::snprintf(label, sizeof label,
                  "Material %.1f: the pipe's first resonance rings %.3f s (law %.3f), its fourth %.3f s (law %.3f)",
                  material, m1, first, m4, fourth);
    SHOW(std::fabs(m1 - first) < 0.08 * first && std::fabs(m4 - fourth) < 0.08 * fourth, label);
    SHOW(m4 < 0.8 * m1, "an upper resonance dies sooner than the lowest");
  }
}

// Position, Opening, Tone, Width and Mix.
static void check_shape_controls() {
  char label[200];
  const vd::Body& pipe = vd::kBodies[1];

  // Position: half way along an open tube the even resonances have a node
  // and the odd ones their most; a quarter of the way along, the fourth has
  // a node and the second its most. The knob runs from 3 % in to the middle.
  const auto pipe_level = [&](float place, int k) {
    inside(device, kRate, 1);
    device.set_param(p::kMaterial, 0.7f);
    device.set_param(p::kOpening, 1.0f);
    device.set_param(p::kPosition, (place - vd::kEdge) / (pipe.far - vd::kEdge));
    Stereo out = run(device, impulse(0.6f, kRate, 0.5f));
    return tone_level(out.left, k * pipe.base_hz, kRate, 2400, 24000);
  };
  const double mid1 = pipe_level(0.5f, 1), mid2 = pipe_level(0.5f, 2), mid3 = pipe_level(0.5f, 3);
  const double quarter2 = pipe_level(0.25f, 2), quarter4 = pipe_level(0.25f, 4);
  std::snprintf(label, sizeof label,
                "Position at the middle of the pipe: the second resonance is %.1f dB under the first and third",
                db(mid2 / std::min(mid1, mid3)));
  SHOW(mid2 < 0.03 * std::min(mid1, mid3), label);
  std::snprintf(label, sizeof label,
                "Position a quarter along: the fourth resonance is %.1f dB under the second",
                db(quarter4 / quarter2));
  SHOW(quarter4 < 0.03 * quarter2 && quarter2 > 10.0 * mid2, label);

  // Opening closed holds the upper resonances in by ratio^-1.5: the fourth
  // against the first falls by that much more than with the body open.
  {
    const auto fourth_over_first = [&](float opening) {
      inside(device, kRate, 1);
      device.set_param(p::kMaterial, 0.7f);
      device.set_param(p::kOpening, opening);
      Stereo out = run(device, impulse(0.6f, kRate, 0.5f));
      // Before the direct sound: the impulse itself is in the first sample.
      return tone_level(out.left, 4.0 * pipe.base_hz, kRate, 2400, 9600) /
             tone_level(out.left, pipe.base_hz, kRate, 2400, 9600);
    };
    const double closed = fourth_over_first(0.0f), open = fourth_over_first(1.0f);
    const double expected = -20.0 * vd::kClosedTilt * std::log10(4.0);
    std::snprintf(label, sizeof label, "Opening closed: the fourth resonance is %.1f dB further down (law %.1f)",
                  db(closed / open), expected);
    SHOW_NEAR(db(closed / open), expected, 1.0, label);

    // Some of the sound itself is always heard, more of it open: the first
    // sample of an impulse into a large dead bottle (whose resonances have
    // not answered yet) passes at the direct share times the level match.
    const auto passes = [&](float opening) {
      inside(device, kRate, 0);
      device.set_param(p::kSize, 4.0f);
      device.set_param(p::kMaterial, 0.6f);
      device.set_param(p::kOpening, opening);
      std::vector<float> click(16, 0.0f);
      click[0] = 0.5f;
      Stereo out = run(device, click);
      return std::fabs(out.left[0]) / 0.5 / std::pow(10.0, device.meter(5) / 20.0);
    };
    std::snprintf(label, sizeof label, "Opening: the first sample of an impulse passes at %.3f open, %.3f closed",
                  passes(1.0f), passes(0.0f));
    SHOW(std::fabs(passes(1.0f) - vd::kOpenDirect) < 0.05 && std::fabs(passes(0.0f) - vd::kClosedDirect) < 0.05,
         label);
    SHOW_NEAR(vd::opening_direct(0.5f), vd::kClosedDirect + 0.25 * (vd::kOpenDirect - vd::kClosedDirect), 1.0e-6,
              "the direct sound grows as the square of Opening");
  }

  // Tone tilts what comes out by up to 12 dB about 1.8 kHz, the same amount
  // either way, and the middle leaves it alone.
  {
    rng_state() = 0x70E5u;
    const std::vector<float> source = pink(3.0f, kRate, 0.1f);
    const auto treble = [&](float tone) {
      inside(device, kRate, 5);
      device.set_param(p::kOpening, 1.0f);
      device.set_param(p::kTone, tone);
      Stereo out = run(device, source);
      // The treble against the bass, so that the level match (which turns
      // the whole body down as the treble comes up) drops out.
      double high = 0.0, low = 0.0;
      for (double hz : {6000.0, 7300.0, 8100.0, 9400.0}) {
        const double level = tone_level(out.left, hz, kRate, 48000, 144000);
        high += level * level;
      }
      for (double hz : {110.0, 150.0, 230.0, 310.0}) {
        const double level = tone_level(out.left, hz, kRate, 48000, 144000);
        low += level * level;
      }
      return std::sqrt(high / low);
    };
    const double dark = treble(0.0f), flat = treble(0.5f), bright = treble(1.0f);
    std::snprintf(label, sizeof label, "Tone: the treble is %.1f dB down at 0 and %.1f dB up at 1", db(dark / flat),
                  db(bright / flat));
    const double down = db(dark / flat), up = db(bright / flat);
    SHOW(down < -8.5 && down > -12.5 && up > 8.5 && up < 12.5 && std::fabs(up + down) < 1.0, label);
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kAir, 0.0f);
    Stereo usual = run(device, source);
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kAir, 0.0f);
    device.set_param(p::kTone, 0.0f);
    device.set_param(p::kTone, 0.5f);
    Stereo back = run(device, source);
    SHOW(usual.left == back.left, "Tone in the middle leaves the body's sound as it is");
  }
}

static void check_width_and_range() {
  char label[200];
  rng_state() = 0x51DEu;
  const std::vector<float> source = pink(3.0f, kRate, 0.1f);

  // Width: at zero a mono sound stays mono, the breath included; opened,
  // each side favours different resonances.
  {
    double correlations[3] = {0.0, 0.0, 0.0};
    int which = 0;
    for (float width : {0.0f, 0.5f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kAir, 0.5f);
      device.set_param(p::kWidth, width);
      Stereo out = run(device, source);
      correlations[which++] = correlation(out.left, out.right, 24000);
      if (width == 0.0f) SHOW(out.left == out.right, "Width 0: a mono sound comes out the same on both sides");
    }
    std::snprintf(label, sizeof label, "Width: the two sides correlate %.3f at 0, %.3f at half, %.3f at full",
                  correlations[0], correlations[1], correlations[2]);
    SHOW(correlations[0] > 0.9999 && correlations[1] < 0.9 && correlations[2] < correlations[1] - 0.1, label);
  }

  // Nothing is summed to mono: a sound that is opposite on the two sides
  // comes out as loud as one that is the same on both.
  {
    std::vector<float> flipped(source.size());
    for (size_t i = 0; i < source.size(); ++i) flipped[i] = -source[i];
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    Stereo same = run(device, source, source);
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    Stereo opposite = run(device, source, flipped);
    std::snprintf(label, sizeof label, "an anti-phase input comes out %.2f dB against an in-phase one",
                  db(rms(opposite.left, 24000) / rms(same.left, 24000)));
    SHOW(std::fabs(db(rms(opposite.left, 24000) / rms(same.left, 24000))) < 0.5 &&
             std::fabs(db(rms(opposite.right, 24000) / rms(same.right, 24000))) < 0.5,
         label);
  }

  // Mix 0 is the input, sample for sample.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0x0D7u;
    std::vector<float> left = noise(1.0f, kRate, 0.7f), right = noise(1.0f, kRate, 0.7f);
    Stereo out = run(device, left, right);
    SHOW(out.left == left && out.right == right, "Mix 0 is the input, sample for sample");
  }

  // Every control does something over the whole of its travel on a played
  // phrase: each third of the way changes the sound by more than -30 dB of it.
  {
    const std::vector<float> played = phrase(4.0f, kRate, 0.3f);
    for (int id = 0; id < p::kNumParams; ++id) {
      if (id == p::kBody) continue;
      Stereo last;
      double least = 1.0e9;
      for (int step = 0; step <= 3; ++step) {
        const float t = static_cast<float>(step) / 3.0f;
        const float lo = p::kParamMin[id], hi = p::kParamMax[id];
        const float value = id == p::kSize ? lo * std::pow(hi / lo, t) : lo + (hi - lo) * t;
        device.init(kRate);
        if (id == p::kWidth) device.set_param(p::kAir, 0.0f);
        device.set_param(id, value);
        Stereo out = run(device, played);
        if (step > 0) {
          double difference = 0.0, level = 0.0;
          for (size_t i = 0; i < out.size(); ++i) {
            const double dl = out.left[i] - last.left[i], dr = out.right[i] - last.right[i];
            difference += dl * dl + dr * dr;
            level += static_cast<double>(out.left[i]) * out.left[i] + static_cast<double>(out.right[i]) * out.right[i];
          }
          least = std::min(least, db(std::sqrt(difference / level)));
        }
        last = out;
      }
      std::snprintf(label, sizeof label, "param %d: the least a third of its travel changes a phrase is %.1f dB",
                    id, least);
      SHOW(least > -30.0, label);
    }
    // And each body is its own sound.
    Stereo bodies[vd::kNumBodies];
    for (int b = 0; b < vd::kNumBodies; ++b) {
      device.init(kRate);
      device.set_param(p::kBody, static_cast<float>(b));
      bodies[b] = run(device, played);
    }
    double least = 1.0e9;
    for (int a = 0; a < vd::kNumBodies; ++a) {
      for (int b = a + 1; b < vd::kNumBodies; ++b) {
        double difference = 0.0;
        for (size_t i = 0; i < played.size(); ++i) {
          const double d = bodies[a].left[i] - bodies[b].left[i];
          difference += d * d;
        }
        least = std::min(least, db(std::sqrt(difference / played.size()) / rms(bodies[a].left)));
      }
    }
    std::snprintf(label, sizeof label, "the two closest bodies differ by %.1f dB of the sound", least);
    SHOW(least > -20.0, label);
  }
}

// Mean power of the component at `hz` over `count` windows of `length` samples.
static double band_power(const std::vector<float>& x, double hz, double rate, size_t from, int count,
                         size_t length) {
  double sum = 0.0;
  for (int w = 0; w < count; ++w) {
    const double level = tone_level(x, hz, rate, from + w * length, from + (w + 1) * length);
    sum += level * level;
  }
  return sum / count;
}

// Air: noise through the same resonances, as loud as the input is, and none
// once the input has stopped.
static void check_air() {
  char label[200];
  const vd::Body& pipe = vd::kBodies[1];
  // A tone far above every resonance of the closed pipe, so that what is
  // found at the resonances is the breath alone.
  const auto breath = [&](float air, float gain, double* on, double* between) {
    inside(device, kRate, 1);
    device.set_param(p::kMaterial, 0.6f);
    device.set_param(p::kAir, air);
    Stereo out = run(device, sine(5000.0f, 4.0f, kRate, gain));
    *on = 0.0;
    *between = 0.0;
    for (int k = 1; k <= 3; ++k) {
      *on += band_power(out.left, k * pipe.base_hz, kRate, 48000, 24, 6000);
      *between += band_power(out.left, (k + 0.5) * pipe.base_hz, kRate, 48000, 24, 6000);
    }
  };
  double on, between, quiet_on, quiet_between, half_on, half_between;
  breath(1.0f, 0.5f, &on, &between);
  breath(0.0f, 0.5f, &quiet_on, &quiet_between);
  breath(1.0f, 0.25f, &half_on, &half_between);
  std::snprintf(label, sizeof label,
                "Air: the breath is %.1f dB stronger on the pipe's resonances than between them, and %.1f dB over Air 0",
                0.5 * db(on / between), 0.5 * db(on / quiet_on));
  SHOW(on > 100.0 * between && on > 1.0e4 * quiet_on, label);
  std::snprintf(label, sizeof label, "Air: half the input gives %.1f dB less breath", 0.5 * db(on / half_on));
  SHOW_NEAR(0.5 * db(on / half_on), 6.0, 1.5, label);

  // It stops with the sound: a dead body, a second after the input ends.
  {
    inside(device, kRate, 1);
    device.set_param(p::kMaterial, 0.0f);
    device.set_param(p::kAir, 1.0f);
    Stereo during = run(device, sine(5000.0f, 1.0f, kRate, 0.5f));
    Stereo after = render(device, 9.0f, kRate);
    const double sounding = rms(during.left, 24000);
    const double later = rms(after.left, 48000, 57600);
    std::snprintf(label, sizeof label, "Air: a second after the input stops the breath is %.1f dB down",
                  db(later / sounding));
    SHOW(later < 0.003 * sounding, label);
    SHOW(peak(after.left, 8 * 48000) == 0.0 && peak(after.right, 8 * 48000) == 0.0,
         "Air: exact silence once the breath has gone");
  }
  {
    device.init(kRate);
    device.set_param(p::kAir, 1.0f);
    device.set_param(p::kMix, 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    SHOW(peak(out.left) == 0.0 && peak(out.right) == 0.0, "Air: none in silence");
  }
}

// The largest step from one sample to the next against the peak of the 2 ms
// around it: about 2 pi f / rate for a smooth sound whose highest partial is
// f, and near 1 or more at a click, whatever the level.
static double roughness(const std::vector<float>& x, size_t from = 0) {
  const size_t reach = 48;
  double worst = 0.0;
  for (size_t i = std::max(from, reach) + 1; i + reach < x.size(); ++i) {
    const double step = std::fabs(static_cast<double>(x[i]) - x[i - 1]);
    if (step < 1.0e-4) continue;
    double local = 0.0;
    for (size_t j = i - reach; j <= i + reach; ++j) local = std::max(local, std::fabs(static_cast<double>(x[j])));
    worst = std::max(worst, step / local);
  }
  return worst;
}

// A control moved while sound passes makes no step rougher than the sound's
// own. The reference has no event in it: the same input through the device
// as it stood before the move, and as it stands after. Steps are taken
// against the level around them (roughness), because the level itself may
// change across a move and a louder sound has larger steps with no click.
template <typename Setup, typename Change>
static void click_check(const char* what, const std::vector<float>& input, Setup setup, Change change) {
  char label[200];
  const size_t half = input.size() / 2;
  const std::vector<float> first(input.begin(), input.begin() + half);
  const std::vector<float> second(input.begin() + half, input.end());
  device.init(kRate);
  setup(device);
  Stereo before = run(device, input);
  device.init(kRate);
  setup(device);
  change(device);
  Stereo after = run(device, input);
  device.init(kRate);
  setup(device);
  // The whole run, so that a step between the last sample before the move
  // and the first after it is seen.
  Stereo lead = run(device, first);
  change(device);
  Stereo moved = concat(lead, run(device, second));
  const double reference = std::max(std::max(roughness(before.left, half), roughness(before.right, half)),
                                    std::max(roughness(after.left, half), roughness(after.right, half)));
  const double event = std::max(roughness(moved.left, half - 64), roughness(moved.right, half - 64));
  const double step = std::max(max_step(moved.left, half - 64), max_step(moved.right, half - 64));
  std::snprintf(label, sizeof label, "%s: roughness %.3f against %.3f with no move (largest step %.4f)", what,
                event, reference, step);
  SHOW(event < 1.3 * reference + 0.02 && step < 0.25, label);
}

static void check_clicks() {
  char name[120];
  // Ten held partials from 82 Hz to 2 kHz, unevenly spaced, so that every
  // body passes some of them and the level stays about where it was across a
  // change (a change that makes the sound much louder for a moment has
  // larger steps with no click in it).
  std::vector<float> held(static_cast<size_t>(kRate));
  for (size_t i = 0; i < held.size(); ++i) {
    const double t = static_cast<double>(i) / kRate;
    double sum = 0.0;
    for (int n = 0; n < 10; ++n) sum += std::sin(2.0 * kPi * 82.41 * std::pow(1.4267, n + 0.13 * (n % 3)) * t + n);
    held[i] = static_cast<float>(0.07 * sum);
  }
  const auto ringing = [](Vessel& d) {
    d.set_param(p::kMaterial, 0.8f);
    d.set_param(p::kAir, 0.0f);
    d.set_param(p::kMix, 1.0f);
  };
  for (int from = 0; from < vd::kNumBodies; ++from) {
    for (int to : {(from + 1) % vd::kNumBodies, (from + 3) % vd::kNumBodies}) {
      std::snprintf(name, sizeof name, "Body from %s to %s", kBodyNames[from], kBodyNames[to]);
      click_check(
          name, held,
          [&](Vessel& d) {
            ringing(d);
            d.set_param(p::kBody, static_cast<float>(from));
          },
          [&](Vessel& d) { d.set_param(p::kBody, static_cast<float>(to)); });
    }
  }
  // Three Body changes inside one crossfade: each waits for the one before.
  click_check("Body changed three times at once", held, ringing, [](Vessel& d) {
    d.set_param(p::kBody, 4.0f);
    d.set_param(p::kBody, 0.0f);
    d.set_param(p::kBody, 3.0f);
  });
  struct Move {
    int id;
    float from, to;
    const char* what;
  };
  const Move moves[] = {
      {p::kSize, 1.0f, 2.0f, "Size from 1 to 2"},          {p::kSize, 2.0f, 1.0f, "Size from 2 to 1"},
      {p::kMaterial, 0.0f, 1.0f, "Material from 0 to 1"},  {p::kMaterial, 1.0f, 0.0f, "Material from 1 to 0"},
      {p::kOpening, 0.0f, 1.0f, "Opening from 0 to 1"},    {p::kOpening, 1.0f, 0.0f, "Opening from 1 to 0"},
      {p::kPosition, 0.0f, 1.0f, "Position from 0 to 1"},  {p::kPosition, 1.0f, 0.0f, "Position from 1 to 0"},
      {p::kTone, 0.0f, 1.0f, "Tone from 0 to 1"},          {p::kTone, 1.0f, 0.0f, "Tone from 1 to 0"},
      {p::kWidth, 0.0f, 1.0f, "Width from 0 to 1"},        {p::kWidth, 1.0f, 0.0f, "Width from 1 to 0"},
      {p::kMix, 0.0f, 1.0f, "Mix from 0 to 1"},            {p::kMix, 1.0f, 0.0f, "Mix from 1 to 0"},
  };
  for (const Move& move : moves) {
    click_check(
        move.what, held,
        [&](Vessel& d) {
          ringing(d);
          d.set_param(move.id, move.from);
        },
        [&](Vessel& d) { d.set_param(move.id, move.to); });
  }
}

// The level: whatever the body and whatever is played, what comes out is
// about as loud as what went in, and a held full-scale chord never piles up.
static void check_levels() {
  char label[200];
  rng_state() = 0x1E7E1u;
  const std::vector<float> broadband = pink(5.0f, kRate, 0.125f);
  const std::vector<float> played = phrase(8.0f, kRate, 0.3f);
  const size_t settle = static_cast<size_t>(kRate);

  // Every body at three sizes and three materials, with nothing but the body.
  double pink_low = 0.0, pink_high = 0.0, phrase_low = 0.0, phrase_high = 0.0;
  for (int b = 0; b < vd::kNumBodies; ++b) {
    for (float size : {0.25f, 1.0f, 4.0f}) {
      for (float material : {0.0f, 0.5f, 1.0f}) {
        for (int which = 0; which < 2; ++which) {
          const std::vector<float>& source = which == 0 ? broadband : played;
          device.init(kRate);
          device.set_param(p::kBody, static_cast<float>(b));
          device.set_param(p::kSize, size);
          device.set_param(p::kMaterial, material);
          device.set_param(p::kMix, 1.0f);
          Stereo out = run(device, source);
          const double level = db(rms(out.left, settle) / rms(source, settle));
          if (which == 0) {
            pink_low = std::min(pink_low, level);
            pink_high = std::max(pink_high, level);
          } else {
            phrase_low = std::min(phrase_low, level);
            phrase_high = std::max(phrase_high, level);
          }
        }
      }
    }
  }
  std::snprintf(label, sizeof label,
                "all wet, 54 settings: broadband noise comes out %.1f to %+.1f dB against the input", pink_low,
                pink_high);
  SHOW(pink_low > -3.0 && pink_high < 3.0, label);
  std::snprintf(label, sizeof label, "all wet, 54 settings: a played phrase comes out %.1f to %+.1f dB against the input",
                phrase_low, phrase_high);
  SHOW(phrase_low > -4.5 && phrase_high < 3.5, label);

  // The level hold: a note held exactly on a sharp resonance comes out no
  // more than 1.5 times as loud as it went in, loud or quiet (and the 3 % the
  // follower sags between two peaks at this pitch), and a note at full scale
  // no louder than it went in (the top: it came out at 1.5).
  for (float gain : {1.0f, 0.05f}) {
    inside(device, kRate, 1);
    device.set_param(p::kMaterial, 1.0f);
    Stereo out = run(device, sine(vd::kBodies[1].base_hz, 6.0f, kRate, gain));
    std::snprintf(label, sizeof label, "a note of %.2f held on a resonance that rings 4 s peaks at %.3f (hold %.1f dB)",
                  gain, peak(out.left), device.meter(4));
    SHOW(peak(out.left) < Vessel::kHoldRatio * gain * 1.06 && peak(out.left) < 1.0005 && peak(out.left) > 0.5 * gain &&
             device.meter(4) < -3.0f,
         label);
  }

  // A full-scale chord held for a minute, at every preset and with each
  // control at each end of its travel (each Body in turn): it peaks no higher
  // than the input does, or than the top where that is higher (it peaked up
  // to 1.38 before the top), and is no louder at the end than at the start.
  const std::vector<float> minute = chord(60.0f, kRate, 1.0f);
  const auto hold_a_minute = [&](const char* what) {
    Stereo out = run(device, minute);
    const size_t n = out.size(), ten = static_cast<size_t>(10.0f * kRate);
    const double top = std::max(peak(out.left), peak(out.right));
    const double early = std::max(rms(out.left, ten / 10, ten), rms(out.right, ten / 10, ten));
    const double late = std::max(rms(out.left, n - ten, n), rms(out.right, n - ten, n));
    std::snprintf(label, sizeof label, "%s: a held full-scale chord peaks at %.3f, %.2f dB louder in its last ten seconds",
                  what, top, db(late / early));
    SHOW(finite(out.left) && finite(out.right) && top < 1.0005 * std::max(peak(minute), static_cast<double>(Vessel::kHoldTop)) &&
             late < early * 1.06,
         label);
  };
  for (const Preset& preset : kPresets) {
    load(device, kRate, preset);
    hold_a_minute(preset.name);
  }
  char what[80];
  for (int id = 0; id < p::kNumParams; ++id) {
    const int steps = id == p::kBody ? vd::kNumBodies : 2;
    for (int step = 0; step < steps; ++step) {
      const float value = id == p::kBody ? static_cast<float>(step) : (step == 0 ? p::kParamMin[id] : p::kParamMax[id]);
      device.init(kRate);
      device.set_param(id, value);
      std::snprintf(what, sizeof what, "param %d at %.2f", id, value);
      hold_a_minute(what);
    }
  }
}

// Sleep, wake, block sizes, bad input, coming to rest, and the meters.
static void check_housekeeping() {
  char label[200];
  const std::vector<float> played = phrase(1.5f, kRate, 0.3f);

  // The same sound at block sizes 1, 128 and 2048 across a sleep, with the
  // breath on and a ringing body: play, fall silent until asleep, play again.
  {
    Stereo reference;
    double worst = 0.0;
    bool slept = true;
    for (int block : {128, 1, 2048}) {
      device.init(kRate);
      device.set_param(p::kAir, 0.6f);
      device.set_param(p::kMaterial, 0.6f);
      Stereo out = run(device, played, block);
      Stereo gap = render(device, 9.0f, kRate, block);
      slept = slept && peak(gap.left, 8 * 48000) == 0.0;
      out = concat(out, gap);
      out = concat(out, run(device, played, block));
      if (block == 128) {
        reference = out;
      } else {
        worst = std::max(worst, worst_difference(out, reference));
      }
    }
    std::snprintf(label, sizeof label, "block sizes 1, 128 and 2048 across a sleep differ by %.2g at most", worst);
    SHOW(slept && worst < 1.0e-6, label);
  }

  // A knob moved while asleep lands at once: the same as when it was moved
  // just after the last sound, long before the sleep.
  {
    const auto after_sleep = [&](bool move_asleep) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      run(device, played);
      if (!move_asleep) {
        device.set_param(p::kSize, 2.5f);
        device.set_param(p::kMaterial, 0.9f);
        device.set_param(p::kPosition, 0.8f);
        device.set_param(p::kBody, 4.0f);
      }
      render(device, 9.0f, kRate);
      if (move_asleep) {
        device.set_param(p::kSize, 2.5f);
        device.set_param(p::kMaterial, 0.9f);
        device.set_param(p::kPosition, 0.8f);
        device.set_param(p::kBody, 4.0f);
      }
      return run(device, played);
    };
    Stereo asleep = after_sleep(true), awake = after_sleep(false);
    std::snprintf(label, sizeof label, "knobs moved while asleep land at once (differs by %.2g from a move before the sleep)",
                  worst_difference(asleep, awake));
    SHOW(worst_difference(asleep, awake) == 0.0, label);
  }

  // Bad input: NaN, infinity and 1e30 for a moment, then the phrase again.
  // The body takes them as silence and is back at once.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kAir, 0.0f);
    run(device, played);
    Stereo clean = run(device, played);
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kAir, 0.0f);
    run(device, played);
    std::vector<float> bad(256, 0.0f);
    for (size_t i = 0; i < bad.size(); ++i) {
      bad[i] = i % 3 == 0 ? std::nanf("") : (i % 3 == 1 ? INFINITY : -1.0e30f);
    }
    Stereo during = run(device, bad);
    Stereo recovered = run(device, played);
    SHOW(finite(during.left) && finite(during.right), "bad input: taken as silence, the output stays finite");
    std::snprintf(label, sizeof label, "bad input: afterwards the phrase comes out %.2f dB against a clean run",
                  db(rms(recovered.left) / rms(clean.left)));
    SHOW(finite(recovered.left) && finite(recovered.right) &&
             std::fabs(db(rms(recovered.left) / rms(clean.left))) < 1.0,
         label);
    Stereo tail = render(device, 12.0f, kRate);
    SHOW(peak(tail.left, 11 * 48000) == 0.0, "bad input: the device still comes to rest");
  }

  // After any control is moved while sounding, the device comes to rest.
  for (int id = 0; id < p::kNumParams; ++id) {
    device.init(kRate);
    run(device, played);
    device.set_param(id, id == p::kBody ? 5.0f : p::kParamMax[id] * 0.83f + p::kParamMin[id] * 0.17f);
    run(device, played);
    device.set_param(id, p::kParamMin[id]);
    render(device, 11.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    std::snprintf(label, sizeof label, "param %d moved while sounding: exact silence afterwards", id);
    SHOW(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, label);
    bool zero = true;
    for (int m = 0; m < 6; ++m) zero = zero && device.meter(m) == 0.0f;
    SHOW(zero, "asleep, every meter reads its resting value");
  }

  // The meters: a note on the open pipe's second resonance lights that one.
  {
    inside(device, kRate, 1);
    device.set_param(p::kMaterial, 0.7f);
    run(device, sine(2.0f * vd::kBodies[1].base_hz, 2.0f, kRate, 0.3f));
    int digits[16];
    for (int m = 0; m < 4; ++m) {
      int packed = static_cast<int>(device.meter(m));
      for (int n = 0; n < 4; ++n) {
        digits[4 * m + n] = packed % 64;
        packed /= 64;
      }
    }
    int loudest = 0;
    for (int k = 1; k < 16; ++k) {
      if (digits[k] > digits[loudest]) loudest = k;
    }
    std::snprintf(label, sizeof label, "meters: a note on the second resonance reads %d there, %d on the first, %d on the third",
                  digits[1], digits[0], digits[2]);
    SHOW(loudest == 1 && digits[1] >= 45 && digits[1] - digits[0] >= 10 && digits[1] - digits[2] >= 10, label);
  }
}

// Part-way Mix: the body never turns against the dry sound. Every strength
// is positive, so at any frequency the wet signal is within a quarter turn
// of the dry one (a little more with Tone off centre) and a held note can
// lose no more than the dry signal's own share: at Mix m the worst a note
// can come out is (1 - m) of what went in. Held notes on every key of the
// piano, through each preset as it stands and through each body at Mix 0.5.
static void check_mix_dips() {
  char label[200];
  const auto worst_dip = [&](const Preset* preset, int body, float mix) {
    double worst = 0.0;
    for (int key = 0; key < 88; ++key) {
      const float hz = 27.5f * std::pow(2.0f, static_cast<float>(key) / 12.0f);
      if (preset != nullptr) {
        load(device, kRate, *preset);
      } else {
        device.init(kRate);
        device.set_param(p::kBody, static_cast<float>(body));
      }
      device.set_param(p::kMix, mix);
      device.set_param(p::kAir, 0.0f);
      Stereo out = run(device, sine(hz, 0.4f, kRate, 0.25f));
      const size_t from = static_cast<size_t>(0.2f * kRate), to = static_cast<size_t>(0.4f * kRate);
      const double level = std::min(tone_level(out.left, hz, kRate, from, to), tone_level(out.right, hz, kRate, from, to));
      worst = std::min(worst, db(level / 0.25));
    }
    return worst;
  };
  for (const Preset& preset : kPresets) {
    const float mix = value_of(preset, p::kMix);
    if (mix >= 1.0f) continue;  // all wet: the dips are the body's own
    const double worst = worst_dip(&preset, 0, mix);
    const double floor = db(1.0 - mix);
    std::snprintf(label, sizeof label, "%s (Mix %.2f): the worst a held note loses is %.1f dB (the dry share is %.1f)",
                  preset.name, mix, worst, floor);
    SHOW(worst > floor - 0.6, label);
  }
  for (int b = 0; b < vd::kNumBodies; ++b) {
    const double worst = worst_dip(nullptr, b, 0.5f);
    std::snprintf(label, sizeof label, "%s at Mix 0.5: the worst a held note loses is %.1f dB", kBodyNames[b], worst);
    SHOW(worst > -6.6, label);
  }
}

// ---------------------------------------------------------------------------
// The second check. Its own material: pad notes of eight partials at 1/h with
// a 10 ms attack, as a line with gaps and as a held chord.

static void pad_note(std::vector<float>& out, double rate, double start, double hz, double length, double gain,
                     double decay) {
  const size_t a = static_cast<size_t>(start * rate), n = static_cast<size_t>(length * rate);
  for (size_t i = 0; i < n && a + i < out.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    double env = std::min(1.0, t / 0.01) * std::exp(-t * decay);
    if ((length - t) / 0.02 < 1.0) env *= (length - t) / 0.02;
    double sum = 0.0;
    for (int h = 1; h <= 8 && hz * h < 0.45 * rate; ++h) sum += std::sin(2.0 * kPi * hz * h * t) / h;
    out[a + i] += static_cast<float>(gain * env * sum);
  }
}
static std::vector<float> pad_line(double seconds, double rate, double gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  const double notes[] = {146.83, 220.0, 174.61, 293.66, 261.63, 196.0, 349.23, 440.0, 233.08, 130.81};
  int n = 0;
  for (double t = 0.0; t < seconds; t += 0.42, ++n) pad_note(out, rate, t, notes[n % 10], 0.36, 0.55 * gain, 2.0);
  return out;
}
static std::vector<float> pad_chord(double seconds, double rate, double gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (double ratio : {1.0, 1.4983, 2.0, 2.3784, 2.9966}) pad_note(out, rate, 0.0, 110.0 * ratio, seconds, 0.16 * gain, 0.0);
  return out;
}
// Both sides' level over [from, to) against the input's there, in dB.
static double level_against(const Stereo& out, const std::vector<float>& in, size_t from, size_t to) {
  const double l = rms(out.left, from, to), r = rms(out.right, from, to);
  return db(std::sqrt(0.5 * (l * l + r * r)) / std::max(rms(in, from, to), 1.0e-12));
}
static void load_all_wet(Vessel& d, float rate, const Preset& preset) {
  load(d, rate, preset);
  d.set_param(p::kMix, 1.0f);
}

// The first 50, 100 and 250 ms of a phrase and of a held chord, all wet:
// after the effect is put on, after a sleep, and after a Body change. The
// level match's starting value is worked out from the knobs, so the first
// note is already at its level (as built it was 13 dB under to 8 dB over
// after init and 18 dB under after a Body change).
static void check_first_note() {
  char label[260];
  const std::vector<float> line = pad_line(5.0, kRate, 0.5), held = pad_chord(5.0, kRate, 0.5);
  const double windows[3] = {0.05, 0.1, 0.25};
  double low[3] = {0.0, 0.0, 0.0}, high[3] = {0.0, 0.0, 0.0}, wake_differs = 0.0;
  const char* highest[3] = {"", "", ""};
  for (const Preset& preset : kPresets) {
    for (const std::vector<float>* source : {&line, &held}) {
      load_all_wet(device, kRate, preset);
      Stereo first = run(device, *source);
      // Asleep, then the same again: it must start as it did the first time.
      Stereo tail = render(device, 14.0f, kRate);
      Stereo again = run(device, *source);
      for (int w = 0; w < 3; ++w) {
        const size_t to = static_cast<size_t>(windows[w] * kRate);
        const double a = level_against(first, *source, 0, to), b = level_against(again, *source, 0, to);
        low[w] = std::min(low[w], a);
        if (a > high[w]) high[w] = a, highest[w] = preset.name;
        wake_differs = std::max(wake_differs, std::fabs(a - b));
      }
      EXPECT(peak(tail.left, tail.size() - 4800) == 0.0, "the device slept between the two phrases");
    }
  }
  // The first 50 ms are read over 25 ms like the rest, so a resonance that a
  // chord's note sits on is up to 4 dB over before the hold has it ("Small
  // tin", whose lowest stands on E4, under a chord with E4 in it). The first
  // 100 and 250 ms were 4.1 and 3.7 dB over there before the hold followed a
  // rise (kRiseFrom).
  std::snprintf(label, sizeof label,
                "16 presets all wet, after init, against the input: the first 50 ms %.1f to %+.1f dB (%s), 100 ms "
                "%.1f to %+.1f dB (%s), 250 ms %.1f to %+.1f dB (%s)",
                low[0], high[0], highest[0], low[1], high[1], highest[1], low[2], high[2], highest[2]);
  SHOW(low[0] > -3.0 && low[1] > -3.0 && low[2] > -3.0 && high[0] < 4.5 && high[1] < 3.8 && high[2] < 2.9, label);
  std::snprintf(label, sizeof label, "the same out of a sleep: within %.3f dB of the first time", wake_differs);
  SHOW(wake_differs < 0.05, label);

  // A Body change on the beat of a note, from every body to every other, at
  // the default Material and at the sharpest.
  double change_low[3] = {0.0, 0.0, 0.0}, change_high[3] = {0.0, 0.0, 0.0};
  const size_t at = static_cast<size_t>(4.2 * kRate);
  for (float material : {0.5f, 1.0f}) {
    for (int from = 0; from < vd::kNumBodies; ++from) {
      for (int to = 0; to < vd::kNumBodies; ++to) {
        if (to == from) continue;
        for (const std::vector<float>* source : {&line, &held}) {
          device.init(kRate);
          device.set_param(p::kBody, static_cast<float>(from));
          device.set_param(p::kMaterial, material);
          device.set_param(p::kMix, 1.0f);
          const std::vector<float> lead(source->begin(), source->begin() + at), rest(source->begin() + at, source->end());
          run(device, lead);
          device.set_param(p::kBody, static_cast<float>(to));
          Stereo after = run(device, rest);
          for (int w = 0; w < 3; ++w) {
            const double level = level_against(after, rest, 0, static_cast<size_t>(windows[w] * kRate));
            change_low[w] = std::min(change_low[w], level);
            change_high[w] = std::max(change_high[w], level);
          }
        }
      }
    }
  }
  std::snprintf(label, sizeof label,
                "after a Body change: 50 ms %.1f to %+.1f dB, 100 ms %.1f to %+.1f dB, 250 ms %.1f to %+.1f dB",
                change_low[0], change_high[0], change_low[1], change_high[1], change_low[2], change_high[2]);
  SHOW(change_low[0] > -9.0 && change_high[0] < 6.5 && change_low[1] > -7.0 && change_high[1] < 6.5 &&
           change_low[2] > -4.0 && change_high[2] < 4.0,
       label);
}

// A played line: every semitone from C2 to C7 in a mixed order, twice (the
// second pass is measured), each note's level in its half second against the
// same note dry. A tuned body passes the notes that land on its resonances
// more than the rest; the floor under its curve, the level match's starting
// value and the level hold keep the loudest and the quietest note of a line
// within 11 dB all wet and 6 dB at Mix 0.5 (as built: up to 31 dB and 9 dB).
static double line_spread(Vessel& d, const std::vector<float>& in, double* lowest, double* highest) {
  const int notes = 61;
  Stereo out = run(d, in);
  double low = 1.0e9, high = -1.0e9;
  for (int i = 0; i < notes; ++i) {
    const size_t a = static_cast<size_t>((notes + i) * 0.5 * kRate), b = a + static_cast<size_t>(0.5 * kRate);
    const double level = level_against(out, in, a, b);
    low = std::min(low, level);
    high = std::max(high, level);
  }
  if (lowest) *lowest = low;
  if (highest) *highest = high;
  return high - low;
}
static void check_played_line() {
  char label[220];
  const int notes = 61;
  std::vector<float> in(static_cast<size_t>(2 * notes * 0.5 * kRate), 0.0f);
  for (int pass = 0; pass < 2; ++pass) {
    for (int i = 0; i < notes; ++i) {
      pad_note(in, kRate, (pass * notes + i) * 0.5, 65.406 * std::pow(2.0, ((i * 37) % notes) / 12.0), 0.4, 0.3, 1.5);
    }
  }
  double worst_wet = 0.0, worst_half = 0.0, lowest = 0.0, highest = 0.0;
  const char* worst_name = "";
  for (const Preset& preset : kPresets) {
    double low, high;
    load_all_wet(device, kRate, preset);
    const double wet = line_spread(device, in, &low, &high);
    if (wet > worst_wet) worst_wet = wet, worst_name = preset.name;
    lowest = std::min(lowest, low);
    highest = std::max(highest, high);
    load(device, kRate, preset);
    device.set_param(p::kMix, 0.5f);
    worst_half = std::max(worst_half, line_spread(device, in, nullptr, nullptr));
  }
  std::snprintf(label, sizeof label,
                "a line over five octaves, 16 presets: loudest to quietest note %.1f dB all wet (%s; notes %.1f to %+.1f dB), %.1f dB at Mix 0.5",
                worst_wet, worst_name, lowest, highest, worst_half);
  SHOW(worst_wet < 11.0 && worst_half < 6.0 && lowest > -8.0 && highest < 7.0, label);
  // Every body at the default Size, dead, half way and at the sharpest.
  double bodies_wet = 0.0;
  for (int b = 0; b < vd::kNumBodies; ++b) {
    for (float material : {0.0f, 0.5f, 0.8f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kBody, static_cast<float>(b));
      device.set_param(p::kMaterial, material);
      device.set_param(p::kMix, 1.0f);
      bodies_wet = std::max(bodies_wet, line_spread(device, in, nullptr, nullptr));
    }
  }
  std::snprintf(label, sizeof label, "the same line, six bodies at four Materials all wet: at most %.1f dB apart",
                bodies_wet);
  SHOW(bodies_wet < 12.0, label);
}

// The level hold lets a tail ring for the time Material says, and never
// turns it up: a note held on a sharp resonance and stopped falls from the
// level it had at the body's own rate (as built the hold opened as the tail
// fell, and a 4 s ring measured 5.2 s). And its gain stands still on held
// notes: what is left of a full-scale chord on three resonances once its own
// sines are taken out is under -40 dB.
static void check_tails_and_distortion() {
  char label[220];
  struct Case {
    int body;
    int mode;
    const char* name;
  };
  for (const Case& c : {Case{0, 0, "bottle"}, Case{1, 0, "open pipe"}, Case{3, 0, "shell"}, Case{4, 1, "drum"}}) {
    inside(device, kRate, c.body);
    device.set_param(p::kMaterial, 1.0f);
    const double hz = vd::kBodies[c.body].base_hz * vd::kBodies[c.body].modes[c.mode].ratio;
    const double law = vd::mode_seconds(vd::kBodies[c.body].modes[c.mode], 1.0f);
    std::vector<float> in = sine(static_cast<float>(hz), 3.0f, kRate, 0.5f);
    in.resize(static_cast<size_t>(6.0 * kRate), 0.0f);
    Stereo out = run(device, in);
    const size_t stop = static_cast<size_t>(3.0 * kRate), tenth = static_cast<size_t>(0.1 * kRate);
    const double had = rms(out.left, stop - tenth, stop);
    double top = 0.0;
    for (size_t a = stop; a + tenth / 10 < out.size(); a += tenth / 10) top = std::max(top, rms(out.left, a, a + tenth / 10));
    const double fall = db(rms(out.left, stop + 2 * tenth, stop + 3 * tenth) / rms(out.left, stop + 20 * tenth, stop + 21 * tenth));
    const double measured = 60.0 * 1.8 / fall;
    std::snprintf(label, sizeof label,
                  "%s: a held note on a resonance comes out %+.1f dB, its tail rings %.2f s (law %.2f s) and is never above the note (%+.2f dB)",
                  c.name, db(had / (0.5 / std::sqrt(2.0))), measured, law, db(top / had));
    SHOW(std::fabs(measured / law - 1.0) < 0.08 && top < had * 1.02 && had < 0.5 / std::sqrt(2.0) * 1.3, label);
  }
  // Distortion: fit the input's own sines to the output and see what is left.
  const auto left_over = [&](int body, std::initializer_list<double> tones) {
    inside(device, kRate, body);
    device.set_param(p::kMaterial, 1.0f);
    const std::vector<double> hz(tones);
    std::vector<float> in(static_cast<size_t>(8.0 * kRate));
    for (size_t i = 0; i < in.size(); ++i) {
      double sum = 0.0;
      for (double f : hz) sum += std::sin(2.0 * kPi * f * static_cast<double>(i) / kRate);
      in[i] = static_cast<float>(sum / static_cast<double>(hz.size()));
    }
    Stereo out = run(device, in);
    // Least squares: the cosine and sine of every tone together.
    const size_t from = static_cast<size_t>(5.0 * kRate), terms = 2 * hz.size();
    std::vector<double> ata(terms * terms, 0.0), atx(terms, 0.0), row(terms);
    const auto fill = [&](size_t i) {
      const double t = static_cast<double>(i) / kRate;
      for (size_t k = 0; k < hz.size(); ++k) {
        row[2 * k] = std::cos(2.0 * kPi * hz[k] * t);
        row[2 * k + 1] = std::sin(2.0 * kPi * hz[k] * t);
      }
    };
    for (size_t i = from; i < out.size(); ++i) {
      fill(i);
      for (size_t a = 0; a < terms; ++a) {
        atx[a] += row[a] * out.left[i];
        for (size_t b = 0; b < terms; ++b) ata[a * terms + b] += row[a] * row[b];
      }
    }
    for (size_t a = 0; a < terms; ++a) {
      const double pivot = ata[a * terms + a];
      for (size_t b = 0; b < terms; ++b) ata[a * terms + b] /= pivot;
      atx[a] /= pivot;
      for (size_t r = 0; r < terms; ++r) {
        if (r == a) continue;
        const double factor = ata[r * terms + a];
        for (size_t b = 0; b < terms; ++b) ata[r * terms + b] -= factor * ata[a * terms + b];
        atx[r] -= factor * atx[a];
      }
    }
    double total = 0.0, left = 0.0;
    for (size_t i = from; i < out.size(); ++i) {
      fill(i);
      double fit = 0.0;
      for (size_t a = 0; a < terms; ++a) fit += atx[a] * row[a];
      left += (out.left[i] - fit) * (out.left[i] - fit);
      total += static_cast<double>(out.left[i]) * out.left[i];
    }
    return 10.0 * std::log10(std::max(left / total, 1.0e-12));
  };
  const double pipe = left_over(1, {130.81, 261.62, 392.43});
  const double low = left_over(2, {65.41});
  const double drum = left_over(4, {82.41, 131.279});
  std::snprintf(label, sizeof label,
                "full scale at the sharpest Material: left over beside the input's sines %.1f dB (pipe chord), %.1f dB (65 Hz note), %.1f dB (drum, two notes)",
                pipe, low, drum);
  SHOW(pipe < -40.0 && low < -40.0 && drum < -40.0, label);
}

// Air at its top: the noise against the wet sound of a held chord, all wet,
// for each body. It is pink noise at a share of the input's level, so about
// as much of it passes a large body as a small one; how loud it is against
// the sound still depends on whether the chord rings the body (the hold
// turns both down when it does). It rides the input: the same against a
// chord 40 dB down. (As built it was white noise and reached 2 dB over the
// sound in a small shell.)
static void check_air_level() {
  char label[220];
  double low = 1.0e9, high = -1.0e9, rides = 0.0;
  for (int b = 0; b < vd::kNumBodies; ++b) {
    for (float size : {0.5f, 1.0f, 2.0f}) {
      double ratio[2];
      int which = 0;
      for (double gain : {0.5, 0.005}) {
        const std::vector<float> in = pad_chord(3.0, kRate, gain);
        Stereo runs[2];
        for (int air = 0; air < 2; ++air) {
          device.init(kRate);
          device.set_param(p::kBody, static_cast<float>(b));
          device.set_param(p::kSize, size);
          device.set_param(p::kMix, 1.0f);
          device.set_param(p::kWidth, 0.0f);
          device.set_param(p::kAir, static_cast<float>(air));
          runs[air] = run(device, in);
        }
        std::vector<float> noise_only(in.size());
        for (size_t i = 0; i < in.size(); ++i) noise_only[i] = runs[1].left[i] - runs[0].left[i];
        const size_t from = static_cast<size_t>(kRate);
        ratio[which++] = db(rms(noise_only, from) / rms(runs[0].left, from));
      }
      low = std::min(low, ratio[0]);
      high = std::max(high, ratio[0]);
      rides = std::max(rides, std::fabs(ratio[0] - ratio[1]));
    }
  }
  std::snprintf(label, sizeof label,
                "Air at full, six bodies at three sizes: the noise is %.1f to %.1f dB against the wet sound of a held chord, and within %.2f dB of that 40 dB down",
                low, high, rides);
  SHOW(low > -27.0 && high < -3.0 && rides < 0.5, label);
}

// Every third of the controls that shape the sound, at every body and the
// smallest, the middle and the largest Size (the first check ran at the
// defaults only): the least a third changes a phrase against the phrase.
static void check_every_third() {
  char label[220];
  const std::vector<float> played = pad_line(4.0, kRate, 0.5);
  const auto least_third = [&](int body, float size, int id) {
    Stereo last;
    double least = 1.0e9;
    for (int step = 0; step <= 3; ++step) {
      device.init(kRate);
      device.set_param(p::kBody, static_cast<float>(body));
      device.set_param(p::kSize, size);
      device.set_param(id, p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * step / 3.0f);
      Stereo out = run(device, played);
      if (step > 0) {
        double difference = 0.0, level = 0.0;
        for (size_t i = 0; i < out.size(); ++i) {
          const double dl = out.left[i] - last.left[i], dr = out.right[i] - last.right[i];
          difference += dl * dl + dr * dr;
          level += static_cast<double>(out.left[i]) * out.left[i] + static_cast<double>(out.right[i]) * out.right[i];
        }
        least = std::min(least, db(std::sqrt(difference / level)));
      }
      last = out;
    }
    return least;
  };
  for (int id : {p::kMaterial, p::kOpening, p::kAir, p::kTone, p::kMix}) {
    double least = 1.0e9;
    for (int b = 0; b < vd::kNumBodies; ++b) {
      for (float size : {0.25f, 1.0f, 4.0f}) least = std::min(least, least_third(b, size, id));
    }
    std::snprintf(label, sizeof label, "%s, six bodies at three sizes: the least a third of its travel changes a phrase is %.1f dB",
                  name_of(id), least);
    SHOW(least > -31.0, label);
  }
  // Width leans the resonances over 80 Hz, so it does little to a body whose
  // resonances lie under the notes played (the largest drum and soundboard);
  // Position does nothing to a bottle's cavity note, which is the same
  // everywhere inside it. Elsewhere both are alive.
  double width_least = 1.0e9, width_large = 1.0e9, position_least = 1.0e9, position_bottle = 1.0e9;
  for (int b = 0; b < vd::kNumBodies; ++b) {
    for (float size : {0.25f, 1.0f, 4.0f}) {
      const double w = least_third(b, size, p::kWidth), x = least_third(b, size, p::kPosition);
      if (size == 4.0f) {
        width_large = std::min(width_large, w);
      } else {
        width_least = std::min(width_least, w);
      }
      if (b == 0) {
        position_bottle = std::min(position_bottle, x);
      } else {
        position_least = std::min(position_least, x);
      }
    }
  }
  std::snprintf(label, sizeof label,
                "Width: the least a third changes a phrase is %.1f dB up to Size 1 (%.1f dB at the largest size); Position %.1f dB (%.1f dB in the bottle)",
                width_least, width_large, position_least, position_bottle);
  SHOW(width_least > -32.0 && position_least > -30.0, label);
}

// Width in mono, and input that is on one side only or opposite on the two.
// The two sides lean by equal and opposite amounts, so no resonance is lost
// when they are added; a held note on a leaning resonance is only held lower
// (the level hold reads the louder side).
static void check_mono_sum() {
  char label[220];
  const std::vector<float> played = pad_line(4.0, kRate, 0.5);
  const auto mono = [](const Stereo& s, size_t from) {
    std::vector<float> sum(s.size());
    for (size_t i = 0; i < s.size(); ++i) sum[i] = 0.5f * (s.left[i] + s.right[i]);
    return rms(sum, from);
  };
  double phrase_worst = 0.0, note_low = 0.0, lean_least = 1.0e9;
  for (int b = 0; b < vd::kNumBodies; ++b) {
    for (float size : {0.25f, 1.0f}) {
      double levels[2];
      for (int w = 0; w < 2; ++w) {
        inside(device, kRate, b);
        device.set_param(p::kSize, size);
        device.set_param(p::kWidth, static_cast<float>(w));
        levels[w] = mono(run(device, played), 4800);
      }
      phrase_worst = std::max(phrase_worst, std::fabs(db(levels[1] / levels[0])));
      // A note held on the first resonance that leans all the way.
      const vd::Body& body = vd::kBodies[b];
      int k = 0;
      while (k < body.count - 1 && vd::mode_hz(body, k, size) < vd::kLeanFullHz) ++k;
      const double hz = vd::mode_hz(body, k, size);
      const std::vector<float> note = sine(static_cast<float>(hz), 3.0f, kRate, 0.5f);
      double sums[2], sides[2] = {0.0, 0.0};
      for (int w = 0; w < 2; ++w) {
        inside(device, kRate, b);
        device.set_param(p::kSize, size);
        device.set_param(p::kMaterial, 0.8f);
        device.set_param(p::kWidth, static_cast<float>(w));
        Stereo out = run(device, note);
        sums[w] = mono(out, 96000);
        if (w == 1) sides[0] = rms(out.left, 96000), sides[1] = rms(out.right, 96000);
      }
      note_low = std::min(note_low, db(sums[1] / sums[0]));
      lean_least = std::min(lean_least, std::fabs(db(sides[0] / sides[1])));
    }
  }
  std::snprintf(label, sizeof label,
                "full Width in mono: a phrase is within %.2f dB of Width 0; a note held on a leaning resonance is %.1f dB under it at worst, and at least %.1f dB louder on one side",
                phrase_worst, note_low, lean_least);
  SHOW(phrase_worst < 3.0 && note_low > -6.5 && lean_least > 9.0, label);

  // One side only, and the two sides opposite, at full Width: each side has
  // its own bank, so the silent side stays silent and nothing cancels.
  for (int b : {1, 3}) {
    inside(device, kRate, b);
    device.set_param(p::kWidth, 1.0f);
    Stereo both = run(device, played, played);
    inside(device, kRate, b);
    device.set_param(p::kWidth, 1.0f);
    Stereo one = run(device, played, std::vector<float>(played.size(), 0.0f));
    std::vector<float> flipped(played.size());
    for (size_t i = 0; i < played.size(); ++i) flipped[i] = -played[i];
    inside(device, kRate, b);
    device.set_param(p::kWidth, 1.0f);
    Stereo opposite = run(device, played, flipped);
    std::snprintf(label, sizeof label,
                  "%s at full Width: left only comes out %.1f dB against both sides fed (right %g); opposite sides %.2f and %.2f dB",
                  kBodyNames[b], db(rms(one.left) / rms(both.left)), peak(one.right),
                  db(rms(opposite.left) / rms(both.left)), db(rms(opposite.right) / rms(both.right)));
    SHOW(std::fabs(db(rms(one.left) / rms(both.left))) < 3.0 && peak(one.right) == 0.0 &&
             std::fabs(db(rms(opposite.left) / rms(both.left))) < 0.01 &&
             std::fabs(db(rms(opposite.right) / rms(both.right))) < 0.01,
         label);
  }
}

// Size thrown from one end to the other at the sharpest Material while a
// chord is held, all wet, at three rates. The resonances land on the chord
// and the level hold has to close by 20 to 30 dB: it must do so smoothly.
// (While the hold's quick power was read a 12.5 ms stretch at a time, it
// fell 3.5 dB in one sample 25 ms after the throw: a step of 0.21 in a chord
// whose own largest step was 0.04.) The largest step after the throw is held
// against the largest of the same chord with Size standing at either end;
// how far the hold's reading falls in one control tick is said beside it.
static void check_thrown_size() {
  struct Throw {
    float rate;
    int body;
    float from, to;
  };
  const Throw throws[] = {{96000.0f, 0, 0.25f, 4.0f}, {44100.0f, 2, 0.25f, 4.0f}, {48000.0f, 0, 0.25f, 4.0f},
                          {48000.0f, 1, 4.0f, 0.25f}, {96000.0f, 4, 4.0f, 0.25f}};
  char label[200];
  for (const Throw& t : throws) {
    const std::vector<float> in = pad_chord(4.0, t.rate, 0.5);
    const size_t half = (in.size() / 2 / 16) * 16 + 16;
    const auto stand = [&](float size) {
      device.init(t.rate);
      device.set_param(p::kBody, static_cast<float>(t.body));
      device.set_param(p::kMaterial, 1.0f);
      device.set_param(p::kAir, 0.0f);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kSize, size);
    };
    double own = 0.0;
    for (float size : {t.from, t.to}) {
      stand(size);
      const Stereo still = run(device, in);
      own = std::max(own, std::max(max_step(still.left), max_step(still.right)));
    }
    // The throw, a control tick at a time, with the hold read after each.
    stand(t.from);
    Stereo moved;
    moved.left.resize(in.size());
    moved.right.resize(in.size());
    double fall = 0.0, last = 0.0;
    for (size_t done = 0; done + 16 <= in.size(); done += 16) {
      if (done == half) device.set_param(p::kSize, t.to);
      for (int i = 0; i < 16; ++i) device.in_left()[i] = device.in_right()[i] = in[done + static_cast<size_t>(i)];
      device.process(16);
      for (int i = 0; i < 16; ++i) {
        moved.left[done + static_cast<size_t>(i)] = device.out_left()[i];
        moved.right[done + static_cast<size_t>(i)] = device.out_right()[i];
      }
      const double hold = device.meter(4);
      if (done > half) fall = std::max(fall, last - hold);
      last = hold;
    }
    const double thrown = std::max(max_step(moved.left, half - 8), max_step(moved.right, half - 8));
    std::snprintf(label, sizeof label,
                  "%s at %.0f Hz, Size %.2f to %.2f at Material 1: largest step %.4f against %.4f standing "
                  "(under 1.5 times); the hold falls %.2f dB a tick at most",
                  kBodyNames[t.body], static_cast<double>(t.rate), static_cast<double>(t.from),
                  static_cast<double>(t.to), thrown, own, fall);
    SHOW(thrown < 1.5 * own && finite(moved.left) && finite(moved.right), label);
  }
}

// --- the third pass: full scale, and the start of a held chord --------------------------------

// `x` scaled so that its largest sample is `top`.
static std::vector<float> peaking_at(std::vector<float> x, double top) {
  const double now = peak(x);
  for (float& v : x) v = static_cast<float>(v * top / now);
  return x;
}

// A preset's Size as the bank moves it with the key (src/dsp/factory/key.ts,
// a 'period'): 2^(-1/12) of it a semitone up, the octave that keeps it in range.
static float size_in_key(float size, int semitones) {
  double moved = size * std::pow(2.0, -semitones / 12.0);
  while (moved > p::kParamMax[p::kSize]) moved *= 0.5;
  while (moved < p::kParamMin[p::kSize]) moved *= 2.0;
  return static_cast<float>(moved);
}

// What goes in under full scale comes out under it. The hold lets the wet
// peak stand 1.5 times over the loudest input peak, which is 3.5 dB: as the
// second pass left it, four presets fed the bank's phrase at -1 dBFS came out
// up to 1.1 dB over full scale, and in other keys six did. The top
// (kHoldTop) keeps the wet peak at 0.98855 or at the input's own peak,
// whichever is larger, and the mix of two things under a line is under it.
static void check_full_scale() {
  char label[240];
  const double hot = 0.8913; // -1 dBFS
  const std::vector<float> sources[3] = {peaking_at(phrase(6.0f, kRate, 0.3f), hot),
                                         peaking_at(pad_line(5.0, kRate, 0.5), hot),
                                         peaking_at(pad_chord(5.0, kRate, 0.5), hot)};
  // Every preset in four keys, at its own Mix and all wet.
  double preset_top = 0.0;
  const char* preset_worst = "";
  bool preset_finite = true;
  for (const Preset& preset : kPresets) {
    for (int key : {0, -5, 3, 6}) {
      for (int wet = 0; wet < 2; ++wet) {
        for (const std::vector<float>& source : sources) {
          load(device, kRate, preset);
          device.set_param(p::kSize, size_in_key(value_of(preset, p::kSize), key));
          if (wet == 1) device.set_param(p::kMix, 1.0f);
          const Stereo out = run(device, source);
          const double top = std::max(peak(out.left), peak(out.right));
          preset_finite = preset_finite && finite(out.left) && finite(out.right);
          if (top > preset_top) preset_top = top, preset_worst = preset.name;
        }
      }
    }
  }
  std::snprintf(label, sizeof label,
                "16 presets in four keys, at their Mix and all wet, fed a phrase, a line and a chord that peak at "
                "-1 dBFS: the output peaks at %+.2f dBFS at most (%s)",
                db(preset_top), preset_worst);
  SHOW(preset_finite && preset_top < 1.0, label);

  // Every body at three sizes and two materials with all the Air there is,
  // open and closed, at full Width.
  double body_top = 0.0;
  for (int b = 0; b < vd::kNumBodies; ++b) {
    for (float size : {0.25f, 1.0f, 4.0f}) {
      for (float material : {0.5f, 1.0f}) {
        for (float opening : {0.0f, 1.0f}) {
          for (const std::vector<float>& source : sources) {
            device.init(kRate);
            device.set_param(p::kBody, static_cast<float>(b));
            device.set_param(p::kSize, size);
            device.set_param(p::kMaterial, material);
            device.set_param(p::kOpening, opening);
            device.set_param(p::kAir, 1.0f);
            device.set_param(p::kWidth, 1.0f);
            device.set_param(p::kMix, 1.0f);
            const Stereo out = run(device, source);
            body_top = std::max(body_top, std::max(peak(out.left), peak(out.right)));
          }
        }
      }
    }
  }
  std::snprintf(label, sizeof label,
                "72 settings all wet with Air at 1 and Width at 1, fed the same: the output peaks at %+.2f dBFS at most",
                db(body_top));
  SHOW(body_top < 1.0, label);

  // At and over full scale the output is never over the input's own peak
  // (the limit after the hold is linear to twice full scale, so this is the
  // hold's doing), at three rates.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double over = 0.0, hot_top = 0.0;
    for (double level : {1.0, 1.5, 3.0}) {
      const std::vector<float> in = peaking_at(pad_chord(3.0, rate, 0.5), level);
      for (const Preset& preset : kPresets) {
        load(device, rate, preset);
        const Stereo out = run(device, in);
        over = std::max(over, std::max(peak(out.left), peak(out.right)) / level);
      }
    }
    const std::vector<float> in = peaking_at(phrase(4.0f, rate, 0.3f), hot);
    for (const Preset& preset : kPresets) {
      load(device, rate, preset);
      const Stereo out = run(device, in);
      hot_top = std::max(hot_top, std::max(peak(out.left), peak(out.right)));
    }
    std::snprintf(label, sizeof label,
                  "at %.0f Hz, 16 presets: a chord that peaks at 0, +3.5 and +9.5 dBFS comes out with %.4f of its "
                  "peak at most; a phrase at -1 dBFS peaks at %+.2f dBFS",
                  static_cast<double>(rate), over, db(hot_top));
    SHOW(over < 1.0005 && hot_top < 1.0, label);
  }

  // Under the knee nothing has changed: the top joins only where 1.5 times
  // the input's peak is over it, which is from -3.6 dBFS, and what never
  // passes that goes through a device that is the same at any level.
  double differs = 0.0;
  for (const Preset& preset : kPresets) {
    load_all_wet(device, kRate, preset);
    const Stereo loud = run(device, peaking_at(sources[0], 0.65));
    load_all_wet(device, kRate, preset);
    Stereo quiet = run(device, peaking_at(sources[0], 0.65 / 16.0));
    for (size_t i = 0; i < quiet.size(); ++i) quiet.left[i] *= 16.0f, quiet.right[i] *= 16.0f;
    differs = std::max(differs, worst_difference(loud, quiet));
  }
  std::snprintf(label, sizeof label,
                "16 presets all wet: a phrase that peaks at -3.7 dBFS and the same 24 dB lower come out %.6f apart "
                "at most, the lower one scaled up",
                differs);
  SHOW(differs < 2.0e-4, label);

  // The top closes by keeping a peak where it is, which makes no step: from
  // one sample to the next the output moves no further at -1 dBFS than it
  // does under the knee, level for level. (As a third rule that joined the
  // hold's two once the input's peak passed -3.6 dBFS, it took the hold down
  // by 2.2 dB in one sample at that moment.)
  double step_ratio = 0.0;
  const char* step_worst = "";
  for (const Preset& preset : kPresets) {
    for (float material : {-1.0f, 0.4f, 0.625f, 0.85f}) {
      for (const std::vector<float>& source : sources) {
        double steps[2] = {0.0, 0.0};
        for (int which = 0; which < 2; ++which) {
          load(device, kRate, preset);
          if (material >= 0.0f) device.set_param(p::kMaterial, material);
          const Stereo out = run(device, which == 0 ? peaking_at(source, 0.65) : source);
          steps[which] = std::max(max_step(out.left), max_step(out.right));
        }
        const double ratio = steps[1] / (steps[0] * hot / 0.65);
        if (ratio > step_ratio) step_ratio = ratio, step_worst = preset.name;
      }
    }
  }
  std::snprintf(label, sizeof label,
                "16 presets at four Materials: the largest step at -1 dBFS is %.3f of the largest at -3.7 dBFS, "
                "level for level (%s)",
                step_ratio, step_worst);
  SHOW(step_ratio < 1.02, label);

  // With the top at work ("Wind in the pipe" fed at -1 dBFS): any block
  // size, across a sleep, and two devices, sample for sample.
  const Preset* wind = nullptr;
  for (const Preset& preset : kPresets) {
    if (std::strcmp(preset.name, "Wind in the pipe") == 0) wind = &preset;
  }
  EXPECT(wind != nullptr, "the preset \"Wind in the pipe\" is in the harness's table");
  if (wind == nullptr) return;
  const std::vector<float>& in = sources[0];
  load(device, kRate, *wind);
  const Stereo reference = run(device, in);
  double least = 0.0;
  {
    // The hold's meter, read a block at a time: how far the top closes it.
    load(device, kRate, *wind);
    const size_t block = static_cast<size_t>(kBlock);
    for (size_t done = 0; done + block <= in.size(); done += block) {
      for (size_t i = 0; i < block; ++i) device.in_left()[i] = device.in_right()[i] = in[done + i];
      device.process(kBlock);
      least = std::min(least, static_cast<double>(device.meter(4)));
    }
  }
  double blocks = 0.0;
  for (int block : {1, 7, 2048}) {
    load(device, kRate, *wind);
    blocks = std::max(blocks, worst_difference(reference, run(device, in, block)));
  }
  load(device, kRate, *wind);
  run(device, in, 2048);
  const Stereo tail = render(device, 14.0f, kRate, 1);
  const Stereo woken = run(device, in, 333);
  load(other, kRate, *wind);
  const Stereo second = run(other, in);
  std::snprintf(label, sizeof label,
                "\"Wind in the pipe\" at -1 dBFS (the hold closes to %.1f dB): blocks of 1, 7 and 2048 differ by %g, "
                "out of a sleep in blocks of 333 by %g, a second device by %g",
                least, blocks, worst_difference(reference, woken), worst_difference(reference, second));
  SHOW(blocks == 0.0 && worst_difference(reference, woken) == 0.0 && worst_difference(reference, second) == 0.0 &&
           peak(tail.left, tail.size() - 4800) == 0.0 && least < -1.0,
       label);
}

// The bank's held tone: every note three partials (1, 1/2, 1/4), the whole at
// -20 dBFS RMS, faded in over 20 ms.
static std::vector<float> held_tone(const std::vector<int>& notes, double seconds, double rate) {
  const size_t frames = static_cast<size_t>(seconds * rate);
  std::vector<double> sum(frames, 0.0);
  for (int note : notes) {
    const double hz = 440.0 * std::pow(2.0, (note - 69) / 12.0);
    for (int partial = 1; partial <= 3; ++partial) {
      const double w = 2.0 * kPi * hz * partial / rate, gain = 1.0 / static_cast<double>(1 << (partial - 1));
      const double phase = note * 0.7 + partial;
      for (size_t i = 0; i < frames; ++i) sum[i] += gain * std::sin(w * static_cast<double>(i) + phase);
    }
  }
  double power = 0.0;
  for (double v : sum) power += v * v;
  const double scale = 0.1 / std::sqrt(power / static_cast<double>(frames));
  const double fade = 0.02 * rate;
  std::vector<float> out(frames);
  for (size_t i = 0; i < frames; ++i) {
    out[i] = static_cast<float>(sum[i] * scale * std::min(1.0, static_cast<double>(i) / fade));
  }
  return out;
}

// The start of a held chord. The hold keeps the wet sound's power at 1.26
// times the input's, which is 2 dB, and it read that power as a 100 ms
// average for as long as the quick reading was within twice of it: while a
// resonance was filling, the average ran up to 3 dB behind and the chord came
// out 3.8 dB over the input in its first quarter second ("Glass tube", the
// bank's A minor), 2 dB once settled. A reading that stays over its average
// is now followed after 25 ms (kRiseFrom), and the first quarter second
// stands with the rest.
static void check_held_start() {
  char label[240];
  const std::vector<std::vector<int>> chords = {{45, 52, 57, 60, 64}, {62, 69, 74, 77, 81}};
  const int notes[13] = {45, 48, 52, 55, 57, 60, 64, 67, 69, 72, 76, 79, 81};
  const size_t quarter = static_cast<size_t>(0.25 * kRate);
  double chord_first = -100.0, chord_settled = -100.0, note_first = -100.0, note_settled = -100.0;
  const char* chord_worst = "";
  for (const Preset& preset : kPresets) {
    for (int which = 0; which < 15; ++which) {
      const std::vector<float> in =
          held_tone(which < 2 ? chords[static_cast<size_t>(which)] : std::vector<int>{notes[which - 2]}, 3.0, kRate);
      load_all_wet(device, kRate, preset);
      const Stereo out = run(device, in);
      const double first = level_against(out, in, 0, quarter);
      double settled = -100.0;
      for (size_t from = 4 * quarter; from + quarter <= in.size(); from += quarter) {
        settled = std::max(settled, level_against(out, in, from, from + quarter));
      }
      if (which < 2) {
        if (first > chord_first) chord_first = first, chord_worst = preset.name;
        chord_settled = std::max(chord_settled, settled);
      } else {
        note_first = std::max(note_first, first);
        note_settled = std::max(note_settled, settled);
      }
    }
  }
  std::snprintf(label, sizeof label,
                "16 presets all wet, the bank's two chords: the first quarter second comes out %+.1f dB against the "
                "input at most (%s), a later one %+.1f dB",
                chord_first, chord_worst, chord_settled);
  SHOW(chord_first < 2.7 && chord_settled < 2.7, label);
  std::snprintf(label, sizeof label,
                "its thirteen notes one at a time: the first quarter second %+.1f dB at most, a later one %+.1f dB",
                note_first, note_settled);
  SHOW(note_first < 2.7 && note_settled < 2.7, label);
}
