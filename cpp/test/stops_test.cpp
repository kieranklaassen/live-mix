// Native harness for Stops (cpp/devices/stops). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a set of organ stops: each rank a sine at
// the true multiple and nothing else, three notes in and three out per rank,
// Speak as the measured rise, the breath of Chiff, the level with all drawn.

#include "../devices/stops/stops.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Stops;
namespace p = livemix::stops;

static Stops device;

static const float kRate = 48000.0f;
static const int kRankParam[Stops::kRanks] = {p::kSub, p::kFifth, p::kOctave, p::kTwelfth, p::kFifteenth};
static const char* kRankName[Stops::kRanks] = {"sub", "fifth", "octave", "twelfth", "fifteenth"};

// Every drawbar in, the ranks alone (no unison), and nothing that moves them:
// what a check then draws is all there is.
static void bare(Stops& d, float rate = kRate) {
  d.init(rate);
  for (int s = 0; s < Stops::kRanks; ++s) d.set_param(kRankParam[s], 0.0f);
  d.set_param(p::kUnison, 0.0f);
  d.set_param(p::kSpeak, 10.0f);
  d.set_param(p::kChiff, 0.0f);
  d.set_param(p::kTone, 0.5f);
  d.set_param(p::kSwell, 1.0f);
  d.set_param(p::kDetune, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// The level of everything in x[from, to) that is not one of `kept`
// frequencies: the residue after each is taken out by least squares (a sine
// and a cosine each), as an RMS.
static double residue(const std::vector<float>& x, const std::vector<double>& kept, double rate, size_t from,
                      size_t to) {
  const size_t n = to - from;
  const size_t m = kept.size() * 2;
  std::vector<double> ata(m * m, 0.0), atb(m, 0.0), basis(m);
  for (size_t i = 0; i < n; ++i) {
    for (size_t f = 0; f < kept.size(); ++f) {
      const double phase = 2.0 * kPi * kept[f] * static_cast<double>(i) / rate;
      basis[2 * f] = std::cos(phase);
      basis[2 * f + 1] = std::sin(phase);
    }
    for (size_t a = 0; a < m; ++a) {
      atb[a] += basis[a] * x[from + i];
      for (size_t b = 0; b < m; ++b) ata[a * m + b] += basis[a] * basis[b];
    }
  }
  // Gauss-Jordan on the normal equations.
  for (size_t col = 0; col < m; ++col) {
    size_t pivot = col;
    for (size_t row = col + 1; row < m; ++row) {
      if (std::fabs(ata[row * m + col]) > std::fabs(ata[pivot * m + col])) pivot = row;
    }
    for (size_t b = 0; b < m; ++b) std::swap(ata[col * m + b], ata[pivot * m + b]);
    std::swap(atb[col], atb[pivot]);
    const double scale = ata[col * m + col];
    if (std::fabs(scale) < 1.0e-12) continue;
    for (size_t b = 0; b < m; ++b) ata[col * m + b] /= scale;
    atb[col] /= scale;
    for (size_t row = 0; row < m; ++row) {
      if (row == col) continue;
      const double factor = ata[row * m + col];
      for (size_t b = 0; b < m; ++b) ata[row * m + b] -= factor * ata[col * m + b];
      atb[row] -= factor * atb[col];
    }
  }
  double sum = 0.0;
  for (size_t i = 0; i < n; ++i) {
    double model = 0.0;
    for (size_t f = 0; f < kept.size(); ++f) {
      const double phase = 2.0 * kPi * kept[f] * static_cast<double>(i) / rate;
      model += atb[2 * f] * std::cos(phase) + atb[2 * f + 1] * std::sin(phase);
    }
    const double left = x[from + i] - model;
    sum += left * left;
  }
  return std::sqrt(sum / static_cast<double>(n));
}

int main() {
  Conformance spec;
  spec.name = "stops";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // 1. One rank drawn, a sine in: the sine times the rank's ratio out, at the
  // sine's own level, and nothing else. Off the bins' centres on purpose.
  for (float hz : {196.0f, 441.3f, 1318.5f}) {
    for (int s = 0; s < Stops::kRanks; ++s) {
      bare(device);
      device.set_param(kRankParam[s], 1.0f);
      const std::vector<float> in = sine(hz, 2.0f, kRate, 0.5f);
      const Stereo out = run(device, in);
      const size_t from = 48000, to = 96000;
      const double want = hz * Stops::kRatio[s];
      const double got = dominant_frequency(out.left, kRate, want * 0.8, want * 1.25, from, to);
      const double level = tone_level(out.left, want, kRate, from, to);
      const double rest = residue(out.left, {want}, kRate, from, to);
      char label[160];
      std::snprintf(label, sizeof label, "%s of %.1f Hz sounds at %.2f Hz (got %.2f)", kRankName[s], hz, want, got);
      EXPECT(std::fabs(got - want) < 0.05, label);
      std::snprintf(label, sizeof label, "%s of %.1f Hz is as loud as its source (%.2f dB)", kRankName[s], hz,
                    db(level / 0.5));
      EXPECT(std::fabs(db(level / 0.5)) < 0.2, label);
      std::snprintf(label, sizeof label, "%s of %.1f Hz: nothing else above -60 dB (%.1f dB)", kRankName[s], hz,
                    db(rest / (0.5 * 0.7071)));
      EXPECT(db(rest / (0.5 * 0.7071)) < -60.0, label);
      if (s == 2 && hz == 441.3f) {
        std::printf("octave of 441.3 Hz: %.3f Hz, %.3f dB, everything else %.1f dB under it\n", got, db(level / 0.5),
                    -db(rest / (0.5 * 0.7071)));
      }
    }
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("stops", 10.0f, kRate, [&] { run(device, input); });
  return finish("stops");
}
