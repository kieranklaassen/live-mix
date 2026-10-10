// Native harness for Stops (cpp/devices/stops). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a set of organ stops: each rank a sine at
// the true multiple and nothing else, three notes in and three out per rank,
// Speak as the measured rise, the breath of Chiff, the level with all drawn.

#include "../devices/stops/stops.h"
#include "support/test_kit.h"

#include <limits>

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

// Three notes whose sum peaks at full scale.
static std::vector<float> held_chord(float seconds) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / kRate;
    out[i] = static_cast<float>(
        (std::sin(2.0 * kPi * 220.0 * t) + std::sin(2.0 * kPi * 277.18 * t + 1.0) + std::sin(2.0 * kPi * 329.63 * t + 2.0)) /
        3.0);
  }
  return out;
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

  // 2. A chord of three sines in, one rank drawn: three sines out, each the
  // rank's ratio above its own note and as loud, and nothing else.
  {
    const double notes[3] = {261.63, 329.63, 392.0};
    std::vector<float> chord(static_cast<size_t>(2.0f * kRate));
    for (size_t i = 0; i < chord.size(); ++i) {
      double v = 0.0;
      for (double hz : notes) v += std::sin(2.0 * kPi * hz * static_cast<double>(i) / kRate);
      chord[i] = static_cast<float>(0.2 * v);
    }
    double worst_level = 0.0, worst_rest = -200.0;
    for (int s = 0; s < Stops::kRanks; ++s) {
      bare(device);
      device.set_param(kRankParam[s], 1.0f);
      const Stereo out = run(device, chord);
      const size_t from = 48000, to = 96000;
      std::vector<double> wanted;
      for (double hz : notes) {
        wanted.push_back(hz * Stops::kRatio[s]);
        worst_level = std::max(worst_level, std::fabs(db(tone_level(out.left, wanted.back(), kRate, from, to) / 0.2)));
      }
      worst_rest = std::max(worst_rest, db(residue(out.left, wanted, kRate, from, to) / (0.2 * std::sqrt(1.5))));
    }
    std::printf("three notes, each rank in turn: levels within %.2f dB, everything else %.1f dB under the chord\n",
                worst_level, -worst_rest);
    EXPECT(worst_level < 0.3, "a chord of three notes gives three per rank, each as loud as its note");
    EXPECT(worst_rest < -50.0, "and nothing else above -50 dB");
  }

  // 3. The latency and the dry side. Mix 0 is the input kLatency late, bit
  // for bit, with everything drawn; so is every rank in with the unison full,
  // at any Mix. The manifest says 4608.
  {
    EXPECT(Stops::kLatency == 4608, "latencySamples in device.json is Stft::kLatency");
    rng_state() = 77;
    const std::vector<float> in = noise(1.0f, kRate, 0.5f);
    for (int which = 0; which < 3; ++which) {
      device.init(kRate);
      if (which == 0) {
        for (int s = 0; s < Stops::kRanks; ++s) device.set_param(kRankParam[s], 1.0f);
        device.set_param(p::kUnison, 0.3f);
        device.set_param(p::kMix, 0.0f);
      } else {
        for (int s = 0; s < Stops::kRanks; ++s) device.set_param(kRankParam[s], 0.0f);
        device.set_param(p::kUnison, 1.0f);
        device.set_param(p::kMix, which == 1 ? 0.65f : 1.0f);
      }
      const Stereo out = run(device, in);
      bool same = true;
      for (size_t i = 0; i + Stops::kLatency < in.size(); ++i) {
        same = same && out.left[i + Stops::kLatency] == in[i] && out.right[i + Stops::kLatency] == in[i];
      }
      EXPECT(same, which == 0 ? "Mix 0 is the input, a latency late, bit for bit"
                              : "every rank in and the unison full is the input, a latency late, bit for bit");
    }
  }

  // 4. Part-way Mix does not comb: held notes over the piano's range through
  // the defaults come out with the note itself at the level it went in.
  {
    double worst = 0.0;
    for (int note = 21; note <= 108; note += 3) {
      const double hz = 440.0 * std::pow(2.0, (note - 69) / 12.0);
      device.init(kRate);
      const std::vector<float> in = sine(static_cast<float>(hz), 1.5f, kRate, 0.5f);
      const Stereo out = run(device, in);
      worst = std::max(worst, std::fabs(db(tone_level(out.left, hz, kRate, 24000, 72000) / 0.5)));
    }
    std::printf("held notes A0 to C8 at the defaults: the note itself within %.3f dB of the input\n", worst);
    EXPECT(worst < 0.1, "the note played keeps its level at the default Mix over the piano's range");
  }

  // 5. Speak is the rise of the ranks. A note starts after a silence; the
  // octave alone is read in 5 ms steps. The time it takes from the note's
  // start (as the dry side gives it, a latency late) to 90 % of its level
  // follows Speak, plus what the frame itself smears.
  {
    const size_t start = 24000;
    std::vector<float> in = silence(0.5f, kRate);
    const std::vector<float> tone = sine(440.0f, 6.0f, kRate, 0.5f);
    in.insert(in.end(), tone.begin(), tone.end());
    const float speaks[4] = {10.0f, 100.0f, 400.0f, 1600.0f};
    double reached[4];
    for (int which = 0; which < 4; ++which) {
      bare(device);
      device.set_param(p::kOctave, 1.0f);
      device.set_param(p::kSpeak, speaks[which]);
      const Stereo out = run(device, in);
      const double full = rms(out.left, out.left.size() - 24000, out.left.size());
      reached[which] = -1.0;
      const size_t step = 240;
      for (size_t at = start + Stops::kLatency; at + step < out.left.size(); at += step) {
        if (rms(out.left, at, at + step) >= 0.9 * full) {
          reached[which] = 1000.0 * static_cast<double>(at - start - Stops::kLatency) / kRate;
          break;
        }
      }
      EXPECT_NEAR(db(full / (0.5 * 0.7071)), 0.0, 0.2, "the rank comes up to its source's level whatever Speak is");
    }
    std::printf("Speak 10, 100, 400, 1600 ms: the octave reaches 90 %% after %.0f, %.0f, %.0f, %.0f ms\n", reached[0],
                reached[1], reached[2], reached[3]);
    EXPECT(reached[0] >= 0.0 && reached[0] < 60.0, "Speak at its shortest: the rank is there within 60 ms of the note");
    EXPECT_NEAR(reached[1], 100.0, 40.0, "Speak 100 ms: 90 % after about 100 ms");
    EXPECT_NEAR(reached[2], 400.0, 60.0, "Speak 400 ms: 90 % after about 400 ms");
    EXPECT_NEAR(reached[3], 1600.0, 160.0, "Speak 1600 ms: 90 % after about 1600 ms");

    // And the rank stops with its note: a frame after the note's end (as the
    // dry side gives it) nothing is left.
    bare(device);
    device.set_param(p::kOctave, 1.0f);
    device.set_param(p::kSpeak, 400.0f);
    std::vector<float> ended = sine(440.0f, 2.0f, kRate, 0.5f);
    const size_t end = ended.size();
    ended.resize(end + 48000, 0.0f);
    const Stereo out = run(device, ended);
    const size_t gone = end + Stops::kLatency + Stops::Stft::kFrame / 2;
    EXPECT(peak(out.left, gone, out.left.size()) < 0.5 * 0.01, "a rank ends with its note, within half a frame");
    EXPECT(peak(out.left, end + Stops::kLatency + Stops::Stft::kFrame, out.left.size()) == 0.0,
           "and is exact silence a frame after it");
  }

  // 6. Tone, Swell, Detune and the drawbars' law, each against the formula in
  // stops.h (the constants are copied from there).
  {
    // tone_db(): kPivotHz 400, kDarkSlopeDb 12, kBrightHz 1500, kBrightSlopeDb 4, kBrightCutDb 8,
    // kBrightLiftDb 6, kShutterSlopeDb 6.
    auto tone_db = [](double hz, double tone, double swell) {
      const double dark = tone < 0.5 ? 1.0 - 2.0 * tone : 0.0;
      const double bright = tone > 0.5 ? 2.0 * tone - 1.0 : 0.0;
      const double above = hz > 400.0 ? std::log2(hz / 400.0) : 0.0;
      const double tilt = std::max(-8.0, std::min(6.0, 4.0 * bright * std::log2(hz / 1500.0)));
      return tilt - (12.0 * dark + 6.0 * (1.0 - swell)) * above;
    };
    double worst = 0.0;
    for (float hz : {196.0f, 1318.5f, 3000.0f}) {
      const std::vector<float> in = sine(hz, 1.5f, kRate, 0.1f);  // well under the ceiling
      for (int which = 0; which < 7; ++which) {
        const float tone = which < 5 ? 0.25f * static_cast<float>(which) : 0.5f;
        const float swell = which == 5 ? 0.5f : (which == 6 ? 0.25f : 1.0f);
        bare(device);
        device.set_param(p::kOctave, 1.0f);
        device.set_param(p::kTone, tone);
        device.set_param(p::kSwell, swell);
        const Stereo out = run(device, in);
        const double got = db(tone_level(out.left, 2.0 * hz, kRate, 36000, 72000) / 0.1);
        const double want = tone_db(2.0 * hz, tone, swell) - 24.0 * (1.0 - swell);  // kShutterDb 24
        worst = std::max(worst, std::fabs(got - want));
      }
    }
    std::printf("Tone and Swell on the octave of 196, 1318.5 and 3000 Hz: within %.2f dB of the formula\n", worst);
    EXPECT(worst < 0.15, "Tone and Swell shape the ranks as tone_db() and the shutters' 24 dB say");

    bare(device);
    device.set_param(p::kOctave, 1.0f);
    device.set_param(p::kSwell, 0.0f);
    const Stereo shut = run(device, sine(150.0f, 1.5f, kRate, 0.5f));
    EXPECT_NEAR(db(tone_level(shut.left, 300.0, kRate, 36000, 72000) / 0.5), -24.0, 0.1,
                "Swell at 0: the shutters take 24 dB (and no more below 400 Hz)");

    // Detune: kDetuneCents 14 times each rank's kDetuneShare.
    double off = 0.0;
    for (float detune : {0.5f, 1.0f}) {
      for (int s = 0; s < Stops::kRanks; ++s) {
        bare(device);
        device.set_param(kRankParam[s], 1.0f);
        device.set_param(p::kDetune, detune);
        const Stereo out = run(device, sine(441.3f, 2.0f, kRate, 0.5f));
        const double want =
            441.3 * Stops::kRatio[s] * std::pow(2.0, detune * 14.0 * Stops::kDetuneShare[s] / 1200.0);
        const double got = dominant_frequency(out.left, kRate, want * 0.97, want * 1.03, 48000, 96000);
        off = std::max(off, std::fabs(1200.0 * std::log2(got / want)));
      }
    }
    std::printf("Detune at 0.5 and 1: every rank within %.2f cents of its place\n", off);
    EXPECT(off < 0.1, "Detune puts each rank its own share of 14 cents off");

    // A drawbar half out is its position to the power 1.5; two full ranks
    // share the power of one.
    bare(device);
    device.set_param(p::kOctave, 0.5f);
    Stereo out = run(device, sine(441.3f, 1.5f, kRate, 0.5f));
    EXPECT_NEAR(db(tone_level(out.left, 882.6, kRate, 36000, 72000) / 0.5), 20.0 * std::log10(std::pow(0.5, 1.5)), 0.1,
                "a drawbar half out is 9 dB down");
    bare(device);
    device.set_param(p::kOctave, 1.0f);
    device.set_param(p::kSub, 1.0f);
    out = run(device, sine(441.3f, 1.5f, kRate, 0.5f));
    EXPECT_NEAR(db(tone_level(out.left, 882.6, kRate, 36000, 72000) / 0.5), -3.01, 0.1,
                "two full ranks: the octave at -3 dB");
    EXPECT_NEAR(db(tone_level(out.left, 220.65, kRate, 36000, 72000) / 0.5), -3.01, 0.1,
                "two full ranks: the sub at -3 dB");
  }

  // 7. Chiff: breath at the start of a note, round the rank's pitch, gone
  // once the note is held. The octave of 440 Hz with a slow Speak, so the
  // tone itself is still small while the breath sounds.
  {
    const size_t start = 24000;
    std::vector<float> in = silence(0.5f, kRate);
    const std::vector<float> tone = sine(440.0f, 3.0f, kRate, 0.5f);
    in.insert(in.end(), tone.begin(), tone.end());
    const size_t onset = start + Stops::kLatency;
    const size_t early_from = onset, early_to = onset + 4800;         // the first 100 ms
    const size_t late_from = onset + 96000, late_to = onset + 120000;  // two seconds in
    double breath[3], held[3], inside = 0.0, outside = 0.0;
    const float chiffs[3] = {0.0f, 0.5f, 1.0f};
    for (int which = 0; which < 3; ++which) {
      bare(device);
      device.set_param(p::kOctave, 1.0f);
      device.set_param(p::kSpeak, 1500.0f);
      device.set_param(p::kChiff, chiffs[which]);
      const Stereo out = run(device, in);
      breath[which] = residue(out.left, {880.0}, kRate, early_from, early_to);
      held[which] = residue(out.left, {880.0}, kRate, late_from, late_to);
      if (which == 2) {
        // Where the breath lies: its band is ±4 % of 880 Hz (845 to 915).
        for (double hz = 300.0; hz < 3000.0; hz += 10.0) {
          const double level = tone_level(out.left, hz, kRate, early_from, early_to);
          (hz > 820.0 && hz < 940.0 ? inside : outside) += level * level;
        }
      }
    }
    std::printf("Chiff 0, 0.5, 1: breath in the first 100 ms %.1f, %.1f, %.1f dB under the held rank; held, %.1f dB\n",
                -db(breath[0] / 0.3536), -db(breath[1] / 0.3536), -db(breath[2] / 0.3536), -db(held[2] / 0.3536));
    EXPECT(breath[2] > 3.0 * breath[0], "Chiff adds breath at the start of a note");
    EXPECT_NEAR(db(breath[2] / breath[1]), 6.0, 2.0, "half the Chiff is half the breath");
    EXPECT(db(breath[2] / 0.3536) > -26.0 && db(breath[2] / 0.3536) < -6.0,
           "at full Chiff the breath is 6 to 26 dB under the rank it leads");
    EXPECT(inside > 20.0 * outside, "the breath lies round the rank's pitch");
    EXPECT(held[2] < 1.05 * held[0] + 1.0e-6, "and is gone once the note is held");
  }

  // 8. Level. A full-scale chord held: at the defaults for a minute, and for
  // twenty seconds with everything drawn and at each end of every control.
  // The peak is never more than 6 dB over the input's (the ceiling), the
  // level stays within a few dB of the input's and nothing grows.
  {
    const std::vector<float> chord = held_chord(60.0f);
    const std::vector<float> shorter(chord.begin(), chord.begin() + 20 * 48000);
    double worst_peak = 0.0, loudest = -100.0, softest = 100.0;
    auto hold = [&](const char* what, const std::vector<float>& in) {
      const Stereo out = run(device, in);
      const size_t n = out.left.size();
      const double top = std::max(peak(out.left), peak(out.right));
      const double level = db(rms(out.left, 48000, n) / rms(in, 48000, n));
      // (Its peaks wander as the detuned ranks drift past each other; its level does not.)
      const double early = rms(out.left, 2 * 48000, n / 2), late = rms(out.left, n / 2, n);
      worst_peak = std::max(worst_peak, top);
      loudest = std::max(loudest, level);
      softest = std::min(softest, level);
      char label[200];
      std::snprintf(label, sizeof label, "held full-scale chord, %s: peak %.2f (6 dB over the input at most), level %+.1f dB",
                    what, top, level);
      EXPECT(finite(out.left) && top <= 2.0 && level < 4.0, label);
      std::snprintf(label, sizeof label, "held full-scale chord, %s: does not grow (rms %.4f then %.4f)", what, early,
                    late);
      EXPECT(late <= early * 1.01, label);
      return level;
    };
    device.init(kRate);
    const double at_defaults = hold("defaults", chord);
    EXPECT(at_defaults > 0.0 && at_defaults < 3.0, "at the defaults the chord comes out 0 to 3 dB louder");
    device.init(kRate);
    for (int s = 0; s < Stops::kRanks; ++s) device.set_param(kRankParam[s], 1.0f);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kTone, 0.5f);
    hold("every rank full, Mix full", chord);
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int end = 0; end < 2; ++end) {
        device.init(kRate);
        device.set_param(id, end == 0 ? p::kParamMin[id] : p::kParamMax[id]);
        char what[64];
        std::snprintf(what, sizeof what, "param %d at its %s", id, end == 0 ? "minimum" : "maximum");
        hold(what, shorter);
      }
    }
    std::printf("held full-scale chord over every setting tried: peak %.2f at most (%+.1f dB), level %+.1f to %+.1f dB\n",
                worst_peak, db(worst_peak), softest, loudest);
  }

  // 9. Bad input: NaN, infinity and 1e30 in the middle of a note. The output
  // stays finite, and once they have passed through (a latency and a frame)
  // the note and its octave are what they were.
  {
    std::vector<float> in = sine(440.0f, 3.0f, kRate, 0.5f);
    const std::vector<float> clean = in;
    in[48000] = std::nanf("");
    in[48001] = std::numeric_limits<float>::infinity();
    in[48002] = -1.0e30f;
    in[48003] = 1.0e30f;
    device.init(kRate);
    device.set_param(p::kDetune, 0.0f);
    const Stereo good = run(device, clean);
    device.init(kRate);
    device.set_param(p::kDetune, 0.0f);
    const Stereo bad = run(device, in);
    const size_t from = 96000, to = 144000;
    EXPECT(finite(bad.left) && finite(bad.right) && peak(bad.left) < 2.0, "NaN, infinity and 1e30 in: finite out");
    EXPECT_NEAR(db(tone_level(bad.left, 440.0, kRate, from, to) / tone_level(good.left, 440.0, kRate, from, to)), 0.0, 0.01,
                "after bad input the note is back at its level");
    EXPECT_NEAR(db(tone_level(bad.left, 880.0, kRate, from, to) / tone_level(good.left, 880.0, kRate, from, to)), 0.0, 0.05,
                "after bad input the octave is back at its level");
    EXPECT_NEAR(db(rms(bad.left, from, to) / rms(good.left, from, to)), 0.0, 0.05, "and nothing is stuck beside them");
    const Stereo rest = render(device, 6.0f, kRate);
    EXPECT(peak(rest.left, rest.left.size() - 24000, rest.left.size()) == 0.0, "and it comes to rest afterwards");
  }

  // 10. Block sizes across a silence. The followers let go for up to three
  // seconds after the sound, then the device sleeps; the silence is stepped
  // across that moment, and a knob is moved in it. Every block size must
  // give the same samples.
  {
    double worst = 0.0;
    for (float gap = 1.8f; gap < 3.7f; gap += 0.07f) {
      rng_state() = 99;
      std::vector<float> phrase = noise(0.2f, kRate, 0.3f);
      const std::vector<float> tone = sine(330.0f, 0.2f, kRate, 0.3f);
      for (size_t i = 0; i < tone.size(); ++i) phrase[i] += tone[i];
      const std::vector<float> quiet = silence(gap, kRate);
      std::vector<float> again = noise(0.4f, kRate, 0.3f);
      for (size_t i = 0; i < again.size(); ++i) again[i] += tone[i % tone.size()];
      Stereo reference;
      for (int block : {128, 1, 2048, 37}) {
        device.init(kRate);
        device.set_param(p::kChiff, 1.0f);
        Stereo out = run(device, phrase, block);
        out = concat(out, run(device, quiet, block));
        device.set_param(p::kMix, 1.0f);  // moved while asleep (or nearly)
        device.set_param(p::kUnison, 0.5f);
        device.set_param(p::kFifth, 0.8f);
        out = concat(out, run(device, again, block));
        if (block == 128) {
          reference = out;
          continue;
        }
        // The knobs are moved at a block's edge, which lies where the block
        // size puts it: compare from the next sound on.
        for (size_t i = phrase.size() + quiet.size(); i < out.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
          worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - reference.right[i]));
        }
        for (size_t i = 0; i < phrase.size() + quiet.size() - 2048; ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
        }
      }
    }
    std::printf("block sizes 1, 37, 128 and 2048 across a silence of 1.8 to 3.7 s: worst difference %.3g\n", worst);
    EXPECT(worst < 1.0e-6, "the same at every block size across a sleep, with knobs moved in it");

    // A knob moved while asleep snaps: after a long silence, Mix set to 0 is
    // the dry input from the first sample of the next note (to 1e-12: the
    // Stft takes a sample under 1e-15 as zero, and a sine passes through some).
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, sine(330.0f, 0.5f, kRate, 0.3f));
    render(device, 6.0f, kRate);
    device.set_param(p::kMix, 0.0f);
    const std::vector<float> next = sine(550.0f, 0.5f, kRate, 0.3f);
    const Stereo woken = run(device, next);
    bool dry = true;
    for (size_t i = 0; i + Stops::kLatency < next.size(); ++i) {
      dry = dry && std::fabs(woken.left[i + Stops::kLatency] - next[i]) < 1.0e-12f;
    }
    for (size_t i = 0; i < static_cast<size_t>(Stops::kLatency); ++i) dry = dry && woken.left[i] == 0.0f;
    EXPECT(dry, "Mix moved while asleep does not glide in on the next note");
  }

  // 11. No clicks. Each control is stepped across its range while a note
  // sounds; the largest step from one sample to the next is held against the
  // same note with the control at rest at either end (no event in either).
  {
    const std::vector<float> in = sine(220.0f, 2.0f, kRate, 0.4f);
    double worst_ratio = 0.0;
    int worst_id = -1;
    for (int id = 0; id < p::kNumParams; ++id) {
      const float low = p::kParamMin[id], high = p::kParamMax[id];
      for (int way = 0; way < 2; ++way) {
        const float from = way == 0 ? low : high, to = way == 0 ? high : low;
        double rest = 0.0;
        for (float value : {from, to}) {
          device.init(kRate);
          device.set_param(p::kFifth, 0.5f);
          device.set_param(id, value);
          const Stereo quiet = run(device, in);
          rest = std::max(rest, max_step(quiet.left, 24000, quiet.left.size()));
        }
        device.init(kRate);
        device.set_param(p::kFifth, 0.5f);
        device.set_param(id, from);
        const std::vector<float> first(in.begin(), in.begin() + 48000), second(in.begin() + 48000, in.end());
        run(device, first);
        device.set_param(id, to);
        const Stereo moved = run(device, second);
        const double ratio = max_step(moved.left) / rest;
        if (ratio > worst_ratio) {
          worst_ratio = ratio;
          worst_id = id;
        }
      }
    }
    std::printf("every control stepped end to end on a held note: largest step %.2f times the note's own (param %d)\n",
                worst_ratio, worst_id);
    EXPECT(worst_ratio < 1.25, "no control clicks when it is moved while a note sounds");
  }

  // 12. Stereo. Mono in is mono out, bit for bit; a sound on one side has its
  // ranks on that side; a sound panned part way keeps its ranks in phase
  // between the channels; an anti-phase pair does not vanish, each channel
  // makes its own ranks.
  {
    rng_state() = 3;
    std::vector<float> left = noise(1.5f, kRate, 0.1f);
    const std::vector<float> tone = sine(261.63f, 1.5f, kRate, 0.3f);
    for (size_t i = 0; i < left.size(); ++i) left[i] += tone[i];
    const std::vector<float> nothing = silence(1.5f, kRate);
    std::vector<float> half(left.size()), flipped(left.size());
    for (size_t i = 0; i < left.size(); ++i) {
      half[i] = 0.5f * left[i];
      flipped[i] = -left[i];
    }
    auto ranks_only = [&] {
      device.init(kRate);
      device.set_param(p::kFifth, 0.6f);
      device.set_param(p::kChiff, 1.0f);
      device.set_param(p::kUnison, 0.0f);
      device.set_param(p::kMix, 1.0f);
    };
    ranks_only();
    const Stereo mono = run(device, left, left);
    EXPECT(mono.left == mono.right, "mono in, mono out, bit for bit");
    ranks_only();
    const Stereo one = run(device, left, nothing);
    EXPECT(peak(one.right) == 0.0 && rms(one.left) > 0.05, "a sound on the left has its ranks on the left only");
    EXPECT(one.left == mono.left, "and they are what they were in mono: the channels do not lean on each other");
    ranks_only();
    const Stereo panned = run(device, left, half);
    const size_t from = 24000, to = left.size();
    EXPECT(correlation(panned.left, panned.right, from, to) > 0.995, "a sound panned part way: its ranks in phase");
    EXPECT_NEAR(db(rms(panned.right, from, to) / rms(panned.left, from, to)), -6.02, 0.3, "and panned as it is");
    ranks_only();
    const Stereo against = run(device, left, flipped);
    EXPECT_NEAR(db(rms(against.right, from, to) / rms(mono.right, from, to)), 0.0, 0.3,
                "an anti-phase pair: each side has its ranks at their level");
    EXPECT(correlation(against.left, against.right, from, to) < -0.99, "and they stay anti-phase, as their sources are");
    // A note that reaches the right half a second after the left: the
    // right's ranks join the left's in phase (they take the left's turn),
    // not at whatever angle they would have started from.
    ranks_only();
    device.set_param(p::kChiff, 0.0f);
    const std::vector<float> first = sine(261.63f, 2.0f, kRate, 0.3f);
    std::vector<float> second = first;
    for (size_t i = 0; i < 24137; ++i) second[i] = 0.0f;
    const Stereo joined = run(device, first, second);
    EXPECT(correlation(joined.left, joined.right, 60000, 96000) > 0.995,
           "a note that comes to the right later: its ranks in phase with the left's");
    // Two notes, one a side: each side gets the octave of its own.
    ranks_only();
    device.set_param(p::kFifth, 0.0f);
    device.set_param(p::kSub, 0.0f);
    const Stereo two = run(device, sine(440.0f, 1.5f, kRate, 0.3f), sine(554.37f, 1.5f, kRate, 0.3f));
    EXPECT(tone_level(two.left, 880.0, kRate, from, to) > 50.0 * tone_level(two.left, 1108.74, kRate, from, to) &&
               tone_level(two.right, 1108.74, kRate, from, to) > 50.0 * tone_level(two.right, 880.0, kRate, from, to),
           "two notes, one a side: each side sounds the octave of its own note");
  }

  // 13. Other sample rates: the same effect. The octave is the octave, as
  // loud; Speak is the same time; the latency is the same count of samples.
  for (float rate : {44100.0f, 96000.0f}) {
    bare(device, rate);
    device.set_param(p::kOctave, 1.0f);
    const std::vector<float> in = sine(441.3f, 2.0f, rate, 0.5f);
    Stereo out = run(device, in);
    const size_t from = static_cast<size_t>(rate), to = static_cast<size_t>(2.0f * rate);
    char label[160];
    std::snprintf(label, sizeof label, "at %.0f Hz the octave of 441.3 Hz is at 882.6 Hz", rate);
    EXPECT_NEAR(dominant_frequency(out.left, rate, 800.0, 960.0, from, to), 882.6, 0.05, label);
    std::snprintf(label, sizeof label, "at %.0f Hz the octave is as loud as its source", rate);
    EXPECT_NEAR(db(tone_level(out.left, 882.6, rate, from, to) / 0.5), 0.0, 0.2, label);
    std::snprintf(label, sizeof label, "at %.0f Hz nothing else above -55 dB", rate);
    EXPECT(db(residue(out.left, {882.6}, rate, from, to) / (0.5 * 0.7071)) < -55.0, label);

    const size_t start = static_cast<size_t>(0.5f * rate);
    std::vector<float> late = silence(0.5f, rate);
    late.insert(late.end(), in.begin(), in.end());
    bare(device, rate);
    device.set_param(p::kOctave, 1.0f);
    device.set_param(p::kSpeak, 400.0f);
    out = run(device, late);
    const double full = rms(out.left, out.left.size() - static_cast<size_t>(0.25f * rate), out.left.size());
    double reached = -1.0;
    const size_t step = static_cast<size_t>(0.005f * rate);
    for (size_t at = start + Stops::kLatency; at + step < out.left.size(); at += step) {
      if (rms(out.left, at, at + step) >= 0.9 * full) {
        reached = 1000.0 * static_cast<double>(at - start - Stops::kLatency) / rate;
        break;
      }
    }
    std::snprintf(label, sizeof label, "at %.0f Hz Speak 400 ms is 400 ms", rate);
    EXPECT_NEAR(reached, 400.0, 60.0, label);

    device.init(rate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 11;
    const std::vector<float> hiss = noise(0.5f, rate, 0.5f);
    out = run(device, hiss);
    bool same = true;
    for (size_t i = 0; i + Stops::kLatency < hiss.size(); ++i) same = same && out.left[i + Stops::kLatency] == hiss[i];
    std::snprintf(label, sizeof label, "at %.0f Hz Mix 0 is the input 4608 samples late", rate);
    EXPECT(same, label);
  }

  // 14. The readings for the display. With one rank drawn on one sine, the
  // unison's reading is the sine's amplitude, the rank's is the amplitude it
  // sounds at, a rank not drawn reads nothing, and the note is the sine's
  // frequency. A rank reads less while it is still speaking, and all read 0
  // once the sound has gone.
  {
    bare(device);
    device.set_param(p::kOctave, 1.0f);
    run(device, sine(441.3f, 2.0f, kRate, 0.5f));
    EXPECT_NEAR(db(device.meter(1) / 0.5), 0.0, 0.1, "the unison's reading is the amplitude of the sine going in");
    EXPECT_NEAR(db(device.meter(3) / 0.5), 0.0, 0.1, "a full rank's reading is the amplitude it sounds at");
    EXPECT(device.meter(0) == 0.0f && device.meter(2) == 0.0f && device.meter(4) == 0.0f && device.meter(5) == 0.0f,
           "a rank that is not drawn reads nothing");
    EXPECT_NEAR(device.meter(6), 441.3, 0.05, "the note's reading is the frequency of the sine");
    const float note_then = device.meter(6);
    const float unison_then = device.meter(1), octave_then = device.meter(3);
    bare(device);
    device.set_param(p::kOctave, 0.5f);
    run(device, sine(441.3f, 2.0f, kRate, 0.5f));
    EXPECT_NEAR(db(device.meter(3) / 0.5), -9.03, 0.1, "a rank drawn half way reads 9 dB less");
    bare(device);
    device.set_param(p::kOctave, 1.0f);
    device.set_param(p::kSpeak, 1600.0f);
    run(device, sine(441.3f, 0.5f, kRate, 0.5f));
    const float early = device.meter(3);
    run(device, sine(441.3f, 4.0f, kRate, 0.5f));
    const float late = device.meter(3);
    EXPECT(early > 0.2f * late && early < 0.7f * late, "a rank reads less while it is still speaking");
    run(device, std::vector<float>(3 * 48000, 0.0f));
    bool none = true;
    for (int m = 0; m < 7; ++m) none = none && device.meter(m) == 0.0f;
    EXPECT(none, "every reading is 0 once the sound has gone");
    device.init(kRate);
    run(device, held_chord(2.0f));
    const float note = device.meter(6);
    EXPECT(std::fabs(note - 220.0f) < 0.3f || std::fabs(note - 277.18f) < 0.3f || std::fabs(note - 329.63f) < 0.3f,
           "on a chord the note's reading is one of its notes");
    std::printf("readings: one sine of 441.3 Hz at 0.5 reads %.2f Hz, unison %.4f, octave %.4f\n", note_then,
                unison_then, octave_then);
  }

  // 15. The presets (the table of device.json, in the order of the ids): a
  // full-scale chord held for a minute at each stays under 6 dB over the
  // input, within reach of its level, and does not grow.
  {
    struct Preset {
      const char* name;
      float values[p::kNumParams];
    };
    // sub, unison, fifth, octave, twelfth, fifteenth, speak, chiff, tone, swell, detune, mix
    static const Preset kPresets[] = {
        {"Principal chorus", {0.55f, 1.0f, 0.0f, 0.7f, 0.3f, 0.2f, 120.0f, 0.25f, 0.4f, 1.0f, 0.2f, 0.8f}},
        {"Pedal under", {0.85f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 200.0f, 0.1f, 0.25f, 1.0f, 0.2f, 0.75f}},
        {"Octave above", {0.0f, 1.0f, 0.0f, 0.8f, 0.0f, 0.0f, 60.0f, 0.15f, 0.45f, 1.0f, 0.15f, 0.6f}},
        {"Open fifths", {0.3f, 1.0f, 0.75f, 0.0f, 0.0f, 0.0f, 150.0f, 0.25f, 0.35f, 1.0f, 0.2f, 0.6f}},
        {"Full organ", {0.8f, 1.0f, 0.35f, 0.9f, 0.6f, 0.6f, 60.0f, 0.3f, 0.55f, 1.0f, 0.2f, 0.9f}},
        {"Flute stops", {0.3f, 1.0f, 0.0f, 0.65f, 0.0f, 0.0f, 90.0f, 0.7f, 0.1f, 1.0f, 0.1f, 0.7f}},
        {"Slow bloom", {0.4f, 1.0f, 0.0f, 0.8f, 0.5f, 0.4f, 1800.0f, 0.0f, 0.35f, 1.0f, 0.2f, 0.8f}},
        {"Only the pipes", {0.6f, 0.0f, 0.0f, 0.8f, 0.4f, 0.3f, 80.0f, 0.25f, 0.4f, 1.0f, 0.2f, 1.0f}},
        {"Glass on top", {0.0f, 1.0f, 0.0f, 0.0f, 0.5f, 0.9f, 300.0f, 0.0f, 0.8f, 1.0f, 0.35f, 0.55f}},
        {"Nearly dry", {0.0f, 1.0f, 0.0f, 0.5f, 0.0f, 0.0f, 250.0f, 0.25f, 0.4f, 1.0f, 0.2f, 0.3f}},
        {"Old pipes", {0.4f, 1.0f, 0.0f, 0.8f, 0.5f, 0.0f, 100.0f, 0.5f, 0.4f, 1.0f, 1.0f, 0.7f}},
        {"Breath first", {0.5f, 1.0f, 0.0f, 0.7f, 0.0f, 0.0f, 900.0f, 1.0f, 0.3f, 1.0f, 0.2f, 0.8f}},
        {"Shutters closed", {0.8f, 1.0f, 0.3f, 0.9f, 0.7f, 0.6f, 200.0f, 0.25f, 0.4f, 0.45f, 0.2f, 1.0f}},
        {"Sub and silver", {0.9f, 1.0f, 0.0f, 0.0f, 0.0f, 0.7f, 150.0f, 0.25f, 0.6f, 1.0f, 0.2f, 0.7f}},
        {"Hollow fifths", {0.0f, 0.5f, 0.9f, 0.0f, 0.8f, 0.0f, 400.0f, 0.25f, 0.4f, 1.0f, 0.4f, 0.75f}},
        {"Drone to organ", {0.8f, 0.75f, 0.5f, 0.7f, 0.5f, 0.3f, 3000.0f, 0.0f, 0.3f, 1.0f, 0.7f, 1.0f}},
    };
    const std::vector<float> chord = held_chord(60.0f);
    double worst = 0.0, softest = 100.0, loudest = -100.0;
    for (const Preset& preset : kPresets) {
      device.init(kRate);
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.values[id]);
      const Stereo out = run(device, chord);
      const size_t n = out.left.size();
      const double top = std::max(peak(out.left), peak(out.right));
      const double level = db(rms(out.left, 5 * 48000, n) / rms(chord, 5 * 48000, n));
      const double early = rms(out.left, 5 * 48000, n / 2), late = rms(out.left, n / 2, n);
      worst = std::max(worst, top);
      softest = std::min(softest, level);
      loudest = std::max(loudest, level);
      char label[200];
      std::snprintf(label, sizeof label, "preset %s, a full-scale chord for a minute: peak %.2f, level %+.1f dB",
                    preset.name, top, level);
      EXPECT(finite(out.left) && finite(out.right) && top <= 2.0 && level < 4.0 && level > -9.0, label);
      std::snprintf(label, sizeof label, "preset %s does not grow (rms %.4f then %.4f)", preset.name, early, late);
      EXPECT(late <= early * 1.01, label);
    }
    std::printf("sixteen presets, a full-scale chord for a minute each: peak %.2f at most, level %+.1f to %+.1f dB\n",
                worst, softest, loudest);
    // Part-way Mix at every preset: a held note over the piano's range comes
    // out with the note itself at the level the mix law gives it,
    // 1 - Mix x (1 - Unison) of what went in: nothing combs it.
    double dip = 0.0, spill = 0.0;
    for (const Preset& preset : kPresets) {
      const double law = 1.0 - preset.values[p::kMix] * (1.0 - preset.values[p::kUnison]);
      for (int note = 21; note <= 108; note += 6) {
        const double hz = 440.0 * std::pow(2.0, (note - 69) / 12.0);
        device.init(kRate);
        for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.values[id]);
        const Stereo out = run(device, sine(static_cast<float>(hz), 1.5f, kRate, 0.5f));
        const double level = tone_level(out.left, hz, kRate, 24000, 72000) / 0.5;
        char label[200];
        std::snprintf(label, sizeof label, "preset %s, a held note at %.1f Hz: the note itself at %.4f of its level (%.4f)",
                      preset.name, hz, law, level);
        if (law > 0.0) {
          dip = std::max(dip, std::fabs(db(level / law)));
          EXPECT(std::fabs(db(level / law)) < 0.1, label);
        } else {
          // Unison out: what is left at the note's place is what the ranks spill there.
          spill = std::max(spill, level);
          EXPECT(level < 3.2e-3, label);
        }
      }
    }
    std::printf("sixteen presets, held notes A0 to A7: the note itself within %.3f dB of the mix law; with the unison "
                "out, %.1f dB under the note at most\n",
                dip, -db(spill));
  }

  // 16. Rest. After a note, with every control moved end to end in the
  // silence that follows, the output is exactly nothing and the device is
  // asleep: a second of that silence costs a small part of a second of sound.
  {
    device.init(kRate);
    const std::vector<float> chord = held_chord(1.0f);
    auto seconds_of = [&](const std::vector<float>& input) {
      double best = 1.0e9;
      std::vector<float> last;
      for (int turn = 0; turn < 3; ++turn) {
        const auto start = std::chrono::steady_clock::now();
        last = run(device, input).left;
        best = std::min(best, std::chrono::duration<double>(std::chrono::steady_clock::now() - start).count());
      }
      return std::make_pair(best, last);
    };
    const double sounding = seconds_of(chord).first;
    // Half a second of silence with each control thrown to both ends and back.
    for (int id = 0; id < p::kNumParams; ++id) {
      device.set_param(id, p::kParamMin[id]);
      run(device, std::vector<float>(1024, 0.0f));
      device.set_param(id, p::kParamMax[id]);
      run(device, std::vector<float>(1024, 0.0f));
      device.set_param(id, p::kParamDefault[id]);
    }
    run(device, std::vector<float>(6 * 48000, 0.0f));
    const auto rest = seconds_of(std::vector<float>(48000, 0.0f));
    EXPECT(peak(rest.second) == 0.0, "at rest after every control was moved in silence: exactly nothing out");
    char label[160];
    std::snprintf(label, sizeof label, "and asleep: a second of it costs %.2f ms against %.2f ms of sound", rest.first * 1e3,
                  sounding * 1e3);
    EXPECT(rest.first < 0.25 * sounding, label);
    std::printf("at rest after every control move: a second of silence %.2f ms, a second of sound %.2f ms\n",
                rest.first * 1e3, sounding * 1e3);
  }

  // 17. Cost: the average, and the worst block (one with a frame in it), at
  // the defaults on a played chord and at the worst there is: every rank
  // full, Chiff full, on noise, where every third bin is a partial.
  {
    const std::vector<float> chord = held_chord(10.0f);
    rng_state() = 0xBEEFu;
    const std::vector<float> hiss = noise(10.0f, kRate, 0.25f);
    for (int which = 0; which < 2; ++which) {
      const std::vector<float>& input = which == 0 ? chord : hiss;
      const char* name = which == 0 ? "stops" : "stops, every rank and full Chiff on noise";
      auto set = [&] {
        device.init(kRate);
        if (which == 1) {
          for (int s = 0; s < Stops::kRanks; ++s) device.set_param(kRankParam[s], 1.0f);
          device.set_param(p::kChiff, 1.0f);
          device.set_param(p::kMix, 1.0f);
        }
      };
      set();
      report_cost(name, 10.0f, kRate, [&] { run(device, input); });
      set();
      std::vector<double> micros;
      for (size_t done = 0; done + 128 <= input.size(); done += 128) {
        for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
        const auto start = std::chrono::steady_clock::now();
        device.process(128);
        micros.push_back(std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count());
      }
      std::sort(micros.begin(), micros.end());
      // One block in four holds a frame of one channel or the other, so the
      // 95th percentile is one of them without the scheduler's noise.
      const double p95 = micros[micros.size() * 95 / 100];
      std::printf("%s worst block: %.1f us, %.2f%% of its 2667 us (median %.1f us)\n", name, p95, 100.0 * p95 / 2666.7,
                  micros[micros.size() / 2]);
    }
  }

  // 18. One analysis for all the stops: on a played chord, five ranks drawn
  // cost nearly what one does (the transforms are shared; a rank is ten bins
  // per partial). On noise, where every third bin is a partial, they cost more.
  {
    const std::vector<float> chord = held_chord(10.0f);
    rng_state() = 0xFACEu;
    const std::vector<float> hiss = noise(10.0f, kRate, 0.25f);
    auto seconds_of = [&](int ranks, const std::vector<float>& input) {
      double best = 1.0e9;
      for (int turn = 0; turn < 3; ++turn) {
        bare(device);
        for (int s = 0; s < ranks; ++s) device.set_param(kRankParam[(s + 2) % Stops::kRanks], 1.0f);
        const auto start = std::chrono::steady_clock::now();
        run(device, input);
        best = std::min(best, std::chrono::duration<double>(std::chrono::steady_clock::now() - start).count());
      }
      return best;
    };
    const double one = seconds_of(1, chord), five = seconds_of(5, chord);
    const double one_hiss = seconds_of(1, hiss), five_hiss = seconds_of(5, hiss);
    char label[160];
    std::snprintf(label, sizeof label, "five stops cost nearly what one does on a chord (%.2f times)", five / one);
    EXPECT(five < 1.5 * one, label);
    std::printf("one stop against five: on a chord %.2f and %.2f %% of real time (%.2f times), on noise %.2f and %.2f %% "
                "(%.2f times)\n",
                10.0 * one, 10.0 * five, five / one, 10.0 * one_hiss, 10.0 * five_hiss, five_hiss / one_hiss);
  }

  return finish("stops");
}
